import type { RestAgentModules } from '../../cliAgent'
import type { BSLCredentialPayload, BSLCSignedCredentialPayload, CredentialMetadata } from '../types'
import type { W3cJsonLdVerifiableCredential } from '@credo-ts/core'

import { Agent, ClaimFormat, utils } from '@credo-ts/core'
import * as crypto from 'crypto'

import { ApiService } from '../../../src/services/apiService'
import { initialBitsEncoded } from '../../constants'
import {
  CredentialContext,
  CredentialType,
  RevocationListType,
  SignatureType,
  W3CRevocationStatus,
} from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors/errors'
import { customDeflate, customInflate } from '../../utils/helpers'

import { Controller, Get, Path, Security, Tags, Example, Response, Route, Post, Body } from 'tsoa'
@Tags('Status List')
@Route('/status-list')
export class StatusListController extends Controller {
  private agent: Agent<RestAgentModules>
  private apiService: ApiService

  public constructor(agent: Agent<RestAgentModules>, apiService: ApiService) {
    super()
    this.agent = agent
    this.apiService = apiService
  }

  /**
   * Create bitstring status list credential
   *
   * @param tenantId Id of the tenant
   * @param request BSLC required details
   */
  @Security('apiKey')
  @Post('/create-bslc')
  public async createBitstringStatusListCredential(
    @Body() request: { issuerDID: string; statusPurpose: string; verificationMethod: string }
  ) {
    try {
      const { issuerDID, statusPurpose, verificationMethod } = request
      const bslcId = utils.uuid()
      const credentialpayload: BSLCredentialPayload = {
        '@context': [`${CredentialContext.V1}`, `${CredentialContext.V2}`],
        id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
        type: [`${CredentialType.VerifiableCredential}`, `${CredentialType.BitstringStatusListCredential}`],
        issuer: {
          id: issuerDID,
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
          type: `${RevocationListType.Bitstring}`,
          statusPurpose: statusPurpose,
          encodedList: initialBitsEncoded,
        },
        //TODO: remove after testing
        credentialStatus: {
          id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
          type: RevocationListType.Bitstring,
        },
      }

      let signedCredential: W3cJsonLdVerifiableCredential | undefined
      try {
        const signedResult = await this.agent.w3cCredentials.signCredential({
          credential: credentialpayload,
          format: ClaimFormat.LdpVc,
          proofType: SignatureType.Ed25519Signature2018,
          verificationMethod,
        })

        if ('proof' in signedResult) {
          signedCredential = signedResult as W3cJsonLdVerifiableCredential
        } else {
          throw new InternalServerError('Signed credential is not of type W3cJsonLdVerifiableCredential')
        }
      } catch (signingError) {
        throw new InternalServerError(`Failed to sign the BitstringStatusListCredential: ${signingError}`)
      }

      if (!signedCredential) {
        throw new InternalServerError('Signed credential is undefined')
      }
      // Step 3: Upload the signed payload to the server
      const serverUrl = process.env.BSLC_SERVER_URL
      if (!serverUrl) {
        throw new Error('BSLC_SERVER_URL is not defined in the environment variables')
      }

      const token = process.env.BSLC_SERVER_TOKEN
      if (!token) {
        throw new Error('BSLC_SERVER_TOKEN is not defined in the environment variables')
      }
      const url = `${serverUrl}${process.env.BSLC_ROUTE}`
      const bslcPayload: BSLCSignedCredentialPayload = {
        id: bslcId,
        bslcObject: signedCredential,
      }
      try {
        await this.apiService.postRequest(url, bslcPayload, token)
      } catch (error) {
        throw new InternalServerError(`Error uploading the BitstringStatusListCredential: ${error}`)
      }
      return { signedCredential, bslcId }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
  /**
   *
   * This endpoint retrieves an unused index from the Bitstring Status List Credential.
   *
   * @param tenantId ID of the tenant
   * @param bslcUrl URL of the BSLC
   * @param bslcId ID of the BSLC
   * @returns An unused index from the Bitstring Status List
   */
  @Security('apiKey')
  @Get('/get-empty-bslc-index/:bslcUrl/:bslcId')
  @Example({ index: 132 })
  @Response<BadRequestError>(400, 'Invalid request parameters')
  @Response<InternalServerError>(500, 'Internal server error')
  public async getEmptyIndexForBSLC(
    @Path('bslcUrl') bslcUrl: string,
    @Path('bslcId') bslcId: string
  ): Promise<{ index: number }> {
    try {
      if (!bslcUrl) {
        throw new BadRequestError('Bslc URL is required')
      }

      const response = await this.apiService.getRequest(bslcUrl)
      if (!response || !response.data) {
        throw new Error('Failed to fetch the BitstringStatusListCredential')
      }
      const credential = response.data
      const encodedList = credential?.credentialSubject?.claims.encodedList
      if (!encodedList) {
        throw new Error('Encoded list not found in the credential')
      }

      const bitstring = customInflate(encodedList)

      // Fetch used indexes from the BSLC server
      const bslcCredentialServerUrl = `${process.env.BSLC_SERVER_URL}${process.env.BSLC_CREDENTIAL_INDEXES_ROUTE}/${bslcId}`
      if (
        !process.env.BSLC_SERVER_URL ||
        !process.env.BSLC_CREDENTIAL_INDEXES_ROUTE ||
        !process.env.BSLC_SERVER_TOKEN
      ) {
        throw new Error(
          'One or more required environment variables are not defined: BSLC_SERVER_URL, BSLC_CREDENTIAL_INDEXES_ROUTE, BSLC_SERVER_TOKEN'
        )
      }
      const token = process.env.BSLC_SERVER_TOKEN
      let fetchedIndexes: number[]

      try {
        const response = (await this.apiService.getRequest(bslcCredentialServerUrl, token)) as {
          data: { data: number }
        }
        if (!response || !response.data || !Array.isArray(response.data.data)) {
          throw new Error('Invalid response data from API')
        }
        fetchedIndexes = response.data.data
      } catch (error) {
        if (error instanceof Error) {
          throw new InternalServerError(`Error calling the credential index API in bslc server: ${error.message}`)
        } else {
          throw new InternalServerError('Error calling the credential index API in bslc server: Unknown error')
        }
      }

      // Find unused indexes
      const usedIndexes = new Set(fetchedIndexes)
      const unusedIndexes = []
      for (let i = 0; i < bitstring.length; i++) {
        if (bitstring[i] === '0' && !usedIndexes.has(i)) {
          unusedIndexes.push(i)
        }
      }

      if (unusedIndexes.length === 0) {
        throw new Error('No unused index found in the BitstringStatusList')
      }

      const randomIndex = unusedIndexes[crypto.getRandomValues(new Uint32Array(1))[0] % unusedIndexes.length]
      return {
        index: randomIndex,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Revoke a W3C credential by revocationId
   *
   * @param tenantId Id of the tenant
   * @param request Revocation request details
   */
  @Security('apiKey')
  @Post('/change-status/:tenantId')
  public async revokeW3CCredential(@Body() request: { revocationId: string; credentialId: string }) {
    try {
      let credentialDetailsObject: CredentialMetadata
      const { revocationId, credentialId } = request

      if (!revocationId || !credentialId) {
        throw new BadRequestError('revocationId and revocationType are required')
      }

      const serverUrl = process.env.BSLC_SERVER_URL
      if (!serverUrl) {
        throw new Error('BSLC_SERVER_URL is not defined in the environment variables')
      }

      const token = process.env.BSLC_SERVER_TOKEN
      if (!token) {
        throw new Error('BSLC_SERVER_TOKEN is not defined in the environment variables')
      }

      // Fetch the credential details from the server
      const credentialMetadataURL = `${serverUrl}/credentials/${credentialId}`
      try {
        const response = (await this.apiService.getRequest(credentialMetadataURL, token)) as {
          data: { data: object }
        }

        if (!response || typeof response.data.data !== 'object') {
          throw new Error('Failed to fetch the credential details')
        }
        credentialDetailsObject = response.data.data as CredentialMetadata
        if (credentialDetailsObject.statusPurpose === W3CRevocationStatus.Revoked.toString()) {
          throw new Error('The credential is already revoked')
        }
        if (!credentialDetailsObject) {
          throw new Error('Credential details not found')
        }
      } catch (error) {
        throw new InternalServerError(`Error fetching the BSLC credential: ${error}`)
      }

      // Fetch the existing BSLC credential from the server
      let bslcCredential
      try {
        const { bslcUrl } = credentialDetailsObject

        if (!bslcUrl) {
          throw new Error('bslcUrl not found in credential details')
        }
        const response = await this.apiService.getRequest(bslcUrl, token)
        if (!response || !response.data) {
          throw new Error('Invalid response data while fetching the BSLC credential')
        }
        bslcCredential = response.data
      } catch (error) {
        throw new InternalServerError(`Error fetching the BSLC credential: ${error}`)
      }
      if (
        !bslcCredential ||
        !bslcCredential.credentialSubject ||
        !bslcCredential.credentialSubject.claims.encodedList
      ) {
        throw new InternalServerError('Invalid BSLC credential fetched from the server')
      }
      const encodedList = bslcCredential.credentialSubject.claims.encodedList
      const bitstring = customInflate(encodedList)
      const revocationIndex = parseInt(credentialDetailsObject.index.toString(), 10)
      if (isNaN(revocationIndex) || revocationIndex < 0 || revocationIndex >= bitstring.length) {
        throw new BadRequestError('Invalid revocationId')
      }

      if (bitstring[revocationIndex] === '1') {
        throw new BadRequestError('The credential is already revoked')
      }

      const updatedBitstring = bitstring.substring(0, revocationIndex) + '1' + bitstring.substring(revocationIndex + 1)
      const updatedEncodedList = customDeflate(updatedBitstring)

      bslcCredential.credentialSubject.claims.encodedList = updatedEncodedList

      let signedCredential

      try {
        //TODO
        signedCredential = await this.agent.w3cCredentials.signCredential<ClaimFormat.LdpVc>({
          credential: bslcCredential,
          format: ClaimFormat.LdpVc,
          proofType: SignatureType.Ed25519Signature2018,
          verificationMethod: bslcCredential.proof.verificationMethod,
        })
      } catch (signingError) {
        throw new InternalServerError(`Failed to sign the updated BSLC credential: ${signingError}`)
      }

      const bslcUrl = `${serverUrl}${process.env.BSLC_ROUTE}`
      // Upload the updated credential back to the server
      try {
        const response = await this.apiService.putRequest(bslcUrl, signedCredential, token)

        if (!response.data) {
          throw new Error('Failed to upload the updated BSLC credential')
        }
      } catch (error) {
        throw new InternalServerError(`Error uploading the updated BSLC credential: ${error}`)
      }

      // Update the credential status in the BSLC server
      const updateStatusUrl = `${serverUrl}/credentials/status/${revocationId}`
      let statusUpdateResponse
      try {
        statusUpdateResponse = await this.apiService.patchRequest(updateStatusUrl, { isValid: false }, token)
        if (!statusUpdateResponse.data) {
          throw new Error('Failed to update the credential status in the BSLC server')
        }
      } catch (error) {
        throw new InternalServerError(`Error updating the credential status in the BSLC server: ${error}`)
      }
      return statusUpdateResponse
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
