import type { RestAgentModules } from '../../cliAgent'
import type { bslcCredentialPayload, BslCredential } from '../types'
import type {
  CredentialExchangeRecordProps,
  CredentialProtocolVersionType,
  PeerDidNumAlgo2CreateOptions,
  Routing,
  W3cJsonLdVerifiableCredential,
} from '@credo-ts/core'

import {
  CredentialState,
  Agent,
  W3cCredentialService,
  CredentialRole,
  createPeerDidDocumentFromServices,
  PeerDidNumAlgo,
  ClaimFormat,
} from '@credo-ts/core'
import axios from 'axios'
import * as crypto from 'crypto'
import { injectable } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'

import { customDeflate, customInflate } from '../../../src/utils/helpers'
import { initialBitsEncoded } from '../../constants'
import {
  CredentialContext,
  CredentialStatusListType,
  CredentialType,
  RevocationListType,
  SignatureType,
  W3CRevocationStatus,
} from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors'
import { CredentialExchangeRecordExample, RecordId } from '../examples'
import { OutOfBandController } from '../outofband/OutOfBandController'
import {
  AcceptCredentialRequestOptions,
  ProposeCredentialOptions,
  AcceptCredentialProposalOptions,
  CredentialOfferOptions,
  CreateOfferOptions,
  AcceptCredential,
  CreateOfferOobOptions,
  ThreadId,
} from '../types'

import { Body, Controller, Get, Path, Post, Route, Tags, Example, Query, Security } from 'tsoa'

@Tags('Credentials')
@Security('apiKey')
@Route('/credentials')
@injectable()
export class CredentialController extends Controller {
  private agent: Agent<RestAgentModules>
  private outOfBandController: OutOfBandController

  public constructor(agent: Agent<RestAgentModules>, outOfBandController: OutOfBandController) {
    super()
    this.agent = agent
    this.outOfBandController = outOfBandController
  }

  /**
   * Retrieve all credential exchange records
   *
   * @returns CredentialExchangeRecord[]
   */
  @Example<CredentialExchangeRecordProps[]>([CredentialExchangeRecordExample])
  @Get('/')
  public async getAllCredentials(
    @Query('threadId') threadId?: ThreadId,
    @Query('parentThreadId') parentThreadId?: ThreadId,
    @Query('connectionId') connectionId?: RecordId,
    @Query('state') state?: CredentialState,
    @Query('role') role?: CredentialRole
  ) {
    try {
      const credentials = await this.agent.credentials.findAllByQuery({
        connectionId,
        threadId,
        state,
        parentThreadId,
        role,
      })

      return credentials.map((c) => c.toJSON())
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  // TODO: Fix W3cCredentialRecordExample from example
  // @Example<W3cCredentialRecordOptions[]>([W3cCredentialRecordExample])
  @Get('/w3c')
  public async getAllW3c() {
    try {
      const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
      const w3cCredentialRecords = await w3cCredentialService.getAllCredentialRecords(this.agent.context)
      return w3cCredentialRecords
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  // TODO: Fix W3cCredentialRecordExample from example
  // @Example<W3cCredentialRecordOptions[]>([W3cCredentialRecordExample])
  @Get('/w3c/:id')
  public async getW3cById(@Path('id') id: string) {
    try {
      const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
      const w3cRecord = await w3cCredentialService.getCredentialRecordById(this.agent.context, id)
      return w3cRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Retrieve credential exchange record by credential record id
   *
   * @param credentialRecordId
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Get('/:credentialRecordId')
  public async getCredentialById(@Path('credentialRecordId') credentialRecordId: RecordId) {
    try {
      const credential = await this.agent.credentials.getById(credentialRecordId)
      return credential.toJSON()
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Initiate a new credential exchange as holder by sending a propose credential message
   * to the connection with a specified connection id.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/propose-credential')
  public async proposeCredential(@Body() proposeCredentialOptions: ProposeCredentialOptions) {
    try {
      const credential = await this.agent.credentials.proposeCredential(proposeCredentialOptions)
      return credential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Accept a credential proposal as issuer by sending an accept proposal message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-proposal')
  public async acceptProposal(@Body() acceptCredentialProposal: AcceptCredentialProposalOptions) {
    try {
      const credential = await this.agent.credentials.acceptProposal(acceptCredentialProposal)

      return credential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Initiate a new credential exchange as issuer by creating a credential offer
   * without specifying a connection id
   *
   * @param options
   * @returns AgentMessage, CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/create-offer')
  public async createOffer(@Body() createOfferOptions: CreateOfferOptions) {
    try {
      const credentialStatus = createOfferOptions?.credentialFormats?.jsonld?.credential.credentialStatus

      if (credentialStatus && Object.keys(credentialStatus).length > 0) {
        if (typeof credentialStatus !== 'object' && !Array.isArray(credentialStatus)) {
          throw new BadRequestError('Missing or invalid credentialStatus in the request.')
        }

        let id: string, type: string, statusPurpose: string, statusListIndex: string, statusListCredential: string

        if (Array.isArray(credentialStatus)) {
          if (credentialStatus.length === 0) {
            throw new BadRequestError('Missing or invalid credentialStatus in the request.')
          }
          ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus[0])
        } else {
          ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus as {
            id: string
            type: string
            statusPurpose: string
            statusListIndex: string
            statusListCredential: string
          })
        }
        if (!id) {
          throw new BadRequestError('Invalid or missing "id" in credentialStatus')
        }
        if (!type || type !== 'BitstringStatusListEntry') {
          throw new BadRequestError('Invalid or missing "type" in credentialStatus')
        }

        if (!statusPurpose) {
          throw new BadRequestError('Invalid or missing "statusPurpose" in credentialStatus')
        }

        if (!statusListIndex || isNaN(Number(statusListIndex))) {
          throw new BadRequestError('Invalid or missing "statusListIndex" in credentialStatus')
        }

        if (!statusListCredential || typeof statusListCredential !== 'string') {
          throw new BadRequestError('Invalid or missing "statusListCredential" in credentialStatus')
        }
      }
      const offer = await this.agent.credentials.offerCredential(createOfferOptions)
      return offer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Post('/create-offer-oob')
  public async createOfferOob(@Body() outOfBandOption: CreateOfferOobOptions) {
    try {
      const credentialStatus = outOfBandOption?.credentialFormats?.jsonld?.credential.credentialStatus

      if (credentialStatus && Object.keys(credentialStatus).length > 0) {
        if (typeof credentialStatus !== 'object' && !Array.isArray(credentialStatus)) {
          throw new BadRequestError('Missing or invalid credentialStatus in the request.')
        }

        let id: string, type: string, statusPurpose: string, statusListIndex: string, statusListCredential: string

        if (Array.isArray(credentialStatus)) {
          if (credentialStatus.length === 0) {
            throw new BadRequestError('Missing or invalid credentialStatus in the request.')
          }
          ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus[0])
        } else {
          ;({ id, type, statusPurpose, statusListIndex, statusListCredential } = credentialStatus as {
            id: string
            type: string
            statusPurpose: string
            statusListIndex: string
            statusListCredential: string
          })
        }
        if (!id) {
          throw new BadRequestError('Invalid or missing "id" in credentialStatus')
        }
        if (!type || type !== 'BitstringStatusListEntry') {
          throw new BadRequestError('Invalid or missing "type" in credentialStatus')
        }

        if (!statusPurpose) {
          throw new BadRequestError('Invalid or missing "statusPurpose" in credentialStatus')
        }

        if (!statusListIndex || isNaN(Number(statusListIndex))) {
          throw new BadRequestError('Invalid or missing "statusListIndex" in credentialStatus')
        }

        if (!statusListCredential || typeof statusListCredential !== 'string') {
          throw new BadRequestError('Invalid or missing "statusListCredential" in credentialStatus')
        }
      }
      let invitationDid: string | undefined
      let routing: Routing
      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }

      if (outOfBandOption?.invitationDid) {
        invitationDid = outOfBandOption?.invitationDid
      } else {
        routing = await this.agent.mediationRecipient.getRouting({})
        const didDocument = createPeerDidDocumentFromServices([
          {
            id: 'didcomm',
            recipientKeys: [routing.recipientKey],
            routingKeys: routing.routingKeys,
            serviceEndpoint: routing.endpoints[0],
          },
        ])
        const did = await this.agent.dids.create<PeerDidNumAlgo2CreateOptions>({
          didDocument,
          method: 'peer',
          options: {
            numAlgo: PeerDidNumAlgo.MultipleInceptionKeyWithoutDoc,
          },
        })
        invitationDid = did.didState.did
      }

      const offerOob = await this.agent.credentials.createOffer({
        protocolVersion: outOfBandOption.protocolVersion as CredentialProtocolVersionType<[]>,
        credentialFormats: outOfBandOption.credentialFormats,
        autoAcceptCredential: outOfBandOption.autoAcceptCredential,
        comment: outOfBandOption.comment,
      })

      const credentialMessage = offerOob.message
      const outOfBandRecord = await this.agent.oob.createInvitation({
        label: outOfBandOption.label,
        messages: [credentialMessage],
        autoAcceptConnection: true,
        imageUrl: outOfBandOption?.imageUrl,
        goalCode: outOfBandOption?.goalCode,
        invitationDid,
      })
      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
        outOfBandRecordId: outOfBandRecord.id,
        credentialRequestThId: offerOob.credentialRecord.threadId,
        invitationDid: outOfBandOption?.invitationDid ? '' : invitationDid,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Accept a credential offer as holder by sending an accept offer message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-offer')
  public async acceptOffer(@Body() acceptCredentialOfferOptions: CredentialOfferOptions) {
    try {
      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }
      const acceptOffer = await this.agent.credentials.acceptOffer(acceptCredentialOfferOptions)
      return acceptOffer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Accept a credential request as issuer by sending an accept request message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-request')
  public async acceptRequest(@Body() acceptCredentialRequestOptions: AcceptCredentialRequestOptions) {
    try {
      const credential = await this.agent.credentials.acceptRequest(acceptCredentialRequestOptions)
      return credential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Accept a credential as holder by sending an accept credential message
   * to the connection associated with the credential exchange record.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-credential')
  public async acceptCredential(@Body() acceptCredential: AcceptCredential) {
    try {
      const credential = await this.agent.credentials.acceptCredential(acceptCredential)
      return credential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Return credentialRecord
   *
   * @param credentialRecordId
   * @returns credentialRecord
   */
  @Get('/:credentialRecordId/form-data')
  public async credentialFormData(@Path('credentialRecordId') credentialRecordId: string) {
    try {
      const credentialDetails = await this.agent.credentials.getFormatData(credentialRecordId)
      return credentialDetails
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
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
      const bslcId = uuidv4()
      const credentialpayload: bslcCredentialPayload = {
        '@context': [`${CredentialContext.V1}`, `${CredentialContext.V2}`],
        id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
        type: [`${CredentialType.VerifiableCredential}`, `${CredentialType.BitstringStatusListCredential}`],
        issuer: {
          id: issuerDID as string,
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
          type: `${RevocationListType.Bitstring}`,
          statusPurpose: statusPurpose,
          encodedList: initialBitsEncoded,
        },
        credentialStatus: {
          id: `${process.env.BSLC_SERVER_URL}${process.env.BSLC_ROUTE}/${bslcId}`,
          type: CredentialStatusListType.CredentialStatusList2017,
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
      const bslcPayload: BslCredential = {
        id: bslcId,
        bslcObject: signedCredential,
      }
      try {
        const response = await axios.post(url, bslcPayload, {
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status !== 200) {
          throw new Error('Failed to upload the signed BitstringStatusListCredential')
        }
      } catch (error) {
        throw new InternalServerError(`Error uploading the BitstringStatusListCredential: ${error}`)
      }
      return { signedCredential, bslcId }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Get empty index for BSLC
   *
   * @param bslcUrl URL of the BSLC
   * @param bslcId ID of the BSLC
   *
   */

  @Security('apiKey')
  @Post('/get-empty-index/:bslcUrl/:bslcId')
  public async getEmptyIndexForBSLC(@Path('bslcUrl') bslcUrl: string, @Path('bslcId') bslcId: string) {
    try {
      if (!bslcUrl) {
        throw new BadRequestError('Bslc URL is required')
      }

      const response = await axios.get(bslcUrl)
      if (response.status !== 200) {
        throw new Error('Failed to fetch the BitstringStatusListCredential')
      }

      const credential = response.data
      const encodedList = credential?.credentialSubject?.claims.encodedList
      if (!encodedList) {
        throw new Error('Encoded list not found in the credential')
      }

      const bitstring = await customInflate(encodedList)

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
        const response = await axios.get(bslcCredentialServerUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.status !== 200) {
          throw new Error(`Failed to fetch data from API. Status code: ${response.status}`)
        }
        if (!response || typeof response !== 'object') {
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
  @Post('/revoke-w3c/:tenantId')
  public async revokeW3CCredential(
    @Path('tenantId') tenantId: string,
    @Body() request: { revocationId: string; credentialId: string }
  ) {
    try {
      let credentialDetailsObject
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
        const response = await axios.get(credentialMetadataURL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status !== 200) {
          throw new Error('Failed to fetch the credential details')
        }
        credentialDetailsObject = response.data.data
        if (credentialDetailsObject.revocationStatus == W3CRevocationStatus.Revoked) {
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
        const response = await axios.get(bslcUrl)
        if (response.status !== 200) {
          throw new Error('Failed to fetch the BitstringStatusListCredential')
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
      const bitstring = await customInflate(encodedList)
      // Update the bitstring based on the revocationId
      const revocationIndex = parseInt(credentialDetailsObject.index, 10)
      if (isNaN(revocationIndex) || revocationIndex < 0 || revocationIndex >= bitstring.length) {
        throw new BadRequestError('Invalid revocationId')
      }

      if (bitstring[revocationIndex] === '1') {
        throw new BadRequestError('The credential is already revoked')
      }

      const updatedBitstring = bitstring.substring(0, revocationIndex) + '1' + bitstring.substring(revocationIndex + 1)
      const updatedEncodedList = await customDeflate(updatedBitstring)

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
        const response = await axios.put(bslcUrl, signedCredential, {
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status !== 200) {
          throw new Error('Failed to upload the updated BSLC credential')
        }
      } catch (error) {
        throw new InternalServerError(`Error uploading the updated BSLC credential: ${error}`)
      }

      // return signedCredential;
      // Update the credential status in the BSLC server
      const updateStatusUrl = `${serverUrl}/credentials/status/${revocationId}`
      let statusUpdateResponse
      try {
        statusUpdateResponse = await axios.patch(
          updateStatusUrl,
          { isValid: false },
          {
            headers: {
              Accept: '*/*',
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (statusUpdateResponse.status !== 200) {
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
