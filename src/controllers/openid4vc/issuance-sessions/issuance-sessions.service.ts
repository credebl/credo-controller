import type { RestAgentModules, RestMultiTenantAgentModules } from '../../../cliAgent'
import type { OpenId4VcIssuanceSessionsCreateOffer, X509GenericRecord } from '../types/issuer.types'
import type { Agent } from '@credo-ts/core'
import type { OpenId4VcIssuanceSessionState } from '@credo-ts/openid4vc'

import { OpenId4VcIssuanceSessionRepository } from '@credo-ts/openid4vc/build/openid4vc-issuer/repository'

import { SignerMethod } from '../../../enums/enum'
import { BadRequestError, NotFoundError } from '../../../errors/errors'
import { X509_CERTIFICATE_RECORD } from '../../../utils/constant'

class IssuanceSessionsService {
  public async createCredentialOffer(
    options: OpenId4VcIssuanceSessionsCreateOffer,
    issuerAgent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
  ) {
    const { credentials, signerOption, publicIssuerId } = options

    const issuer = await issuerAgent.modules.openId4VcIssuer.getIssuerByIssuerId(publicIssuerId)

    if (!signerOption || !signerOption.method) {
      throw new BadRequestError(`signerOption must be provided with one of: ${Object.values(SignerMethod).join(', ')}`)
    }
    if (signerOption.method === SignerMethod.Did && !signerOption.did) {
      throw new BadRequestError(`'did' must be provided when signer method is 'did'`)
    }

    const mappedCredentials = credentials.map((c) => {
      const supported = issuer.credentialConfigurationsSupported[c.credentialSupportedId]
      if (!supported) {
        throw new Error(`CredentialSupportedId '${c.credentialSupportedId}' is not supported by issuer`)
      }
      if (supported.format !== c.format) {
        throw new Error(
          `Format mismatch for '${c.credentialSupportedId}': expected '${supported.format}', got '${c.format}'`,
        )
      }
      return {
        ...c,
        payload: {
          ...c.payload,
          vct: c.payload?.vct ?? (typeof supported.vct === 'string' ? supported.vct : undefined),
        },
      }
      // format: c.format as OpenId4VciCredentialFormatProfile, TODO: fix this type
    })

    options.issuanceMetadata ||= {}

    if (signerOption.method === SignerMethod.Did) {
      options.issuanceMetadata.issuerDid = signerOption.did
    } else if (signerOption.method === SignerMethod.X5c) {
      const record = (await issuerAgent.genericRecords.findById(X509_CERTIFICATE_RECORD)) as X509GenericRecord
      if (!signerOption.x5c && !record) {
        throw new Error('x5c certificate is required')
      }
      const cert = record?.content?.dcs
      const certArray = Array.isArray(cert) ? cert : typeof cert === 'string' ? [cert] : []
      if (!certArray.length) {
        throw new Error('x509 certificate must be non-empty')
      }
      options.issuanceMetadata.issuerx509certificate = signerOption.x5c ?? [...certArray]
    }

    options.issuanceMetadata.credentials = mappedCredentials

    const { credentialOffer, issuanceSession } = await issuerAgent.modules.openId4VcIssuer.createCredentialOffer({
      issuerId: publicIssuerId,
      issuanceMetadata: options.issuanceMetadata,
      offeredCredentials: credentials.map((c) => c.credentialSupportedId),
      preAuthorizedCodeFlowConfig: options.preAuthorizedCodeFlowConfig,
      authorizationCodeFlowConfig: options.authorizationCodeFlowConfig,
    })

    return { credentialOffer, issuanceSession }
  }

  public async getIssuanceSessionsById(
    agent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    sessionId: string,
  ) {
    return agent.modules.openId4VcIssuer.getIssuanceSessionById(sessionId)
  }

  public async getIssuanceSessionsByQuery(
    issuerAgent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    cNonce?: string,
    publicIssuerId?: string,
    preAuthorizedCode?: string,
    state?: OpenId4VcIssuanceSessionState,
    credentialOfferUri?: string,
    authorizationCode?: string,
  ) {
    const issuanceSessionRepository = issuerAgent.dependencyManager.resolve(OpenId4VcIssuanceSessionRepository)
    const issuanceSessions = await issuanceSessionRepository.findByQuery(issuerAgent.context, {
      cNonce,
      issuerId: publicIssuerId,
      preAuthorizedCode,
      state,
      credentialOfferUri,
      authorizationCode,
    })

    return issuanceSessions
  }

  /**
   * update an existing issuance session metadata, useful for mobile edge
   * agents that will scan QR codes to notify the system of their
   * wallet user id
   *
   * @param issuerAgent
   * @param sessionId
   * @param metadata
   * @returns the updated issuance session record
   */
  public async updateSessionIssuanceMetadataById(
    issuerAgent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    sessionId: string,
    metadata: Record<string, unknown>,
  ) {
    const issuanceSessionRepository = issuerAgent.dependencyManager.resolve(OpenId4VcIssuanceSessionRepository)

    const record = await issuanceSessionRepository.findById(issuerAgent.context, sessionId)

    if (!record) {
      throw new NotFoundError(`Issuance session with id ${sessionId} not found`)
    }

    record.issuanceMetadata = {
      ...record.issuanceMetadata,
      ...metadata,
    }

    await issuanceSessionRepository.update(issuerAgent.context, record)

    return record
  }

  /**
   * deletes ann issuance session by id
   *
   * @param sessionId
   * @param issuerAgent
   */
  public async deleteById(
    issuerAgent: Agent<RestMultiTenantAgentModules> | Agent<RestAgentModules>,
    sessionId: string,
  ): Promise<void> {
    const issuanceSessionRepository = issuerAgent.dependencyManager.resolve(OpenId4VcIssuanceSessionRepository)
    await issuanceSessionRepository.deleteById(issuerAgent.context, sessionId)
  }
}

export const issuanceSessionService = new IssuanceSessionsService()
