import type { RestAgentModules } from '../../cliAgent'
import type {
  CredentialExchangeRecordProps,
  CredentialProtocolVersionType,
  PeerDidNumAlgo2CreateOptions,
  Routing,
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
import { injectable } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'

import ErrorHandlingService from '../../errorHandlingService'
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

import { initialBitsEncoded } from 'src/constants'
import {
  CredentialContext,
  CredentialStatusListType,
  CredentialType,
  RevocationListType,
  SignatureType,
} from 'src/enums/enum'
import { BadRequestError, InternalServerError } from 'src/errors'
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
      const offer = await this.agent.credentials.offerCredential(createOfferOptions)
      return offer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Post('/create-offer-oob')
  public async createOfferOob(@Body() outOfBandOption: CreateOfferOobOptions) {
    try {
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
    @Path('tenantId') tenantId: string,
    @Body() request: { issuerDID: string; statusPurpose: string; verificationMethod: string }
  ) {
    try {
      const { issuerDID, statusPurpose, verificationMethod } = request
      const bslcId = uuidv4()
      const credentialpayload = {
        '@context': [`${CredentialContext.V1}`, `${CredentialContext.V2}`],
        id: `${process.env.BSLC_SERVER_URL}/bitstring/${bslcId}`,
        type: [`${CredentialType.VerifiableCredential}`, `${CredentialType.BitstringStatusListCredential}`],
        issuer: {
          id: issuerDID as string,
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `${process.env.BSLC_SERVER_URL}/bitstring/${bslcId}`,
          type: `${RevocationListType.Bitstring}`,
          statusPurpose: statusPurpose,
          encodedList: initialBitsEncoded,
        },
        credentialStatus: {
          id: `${process.env.BSLC_SERVER_URL}/bitstring/${bslcId}`,
          type: CredentialStatusListType.CredentialStatusList2017,
        },
      }

      let signedCredential
      // Step 2: Sign the payload
      try {
        //TODO: Add correct type here
        signedCredential = await this.agent.w3cCredentials.signCredential({
          credential: credentialpayload,
          format: ClaimFormat.LdpVc,
          proofType: SignatureType.Ed25519Signature2018,
          verificationMethod,
        })
      } catch (signingError) {
        throw new InternalServerError(`Failed to sign the BitstringStatusListCredential: ${signingError}`)
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
      const url = `${serverUrl}/bitstring`
      const bslcPayload = {
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
      return signedCredential
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/get-empty-index/:BSLCUrl')
  public async getEmptyIndexForBSLC(@Path('BSLCUrl') BSLCUrl: string) {
    try {
      if (!BSLCUrl) {
        throw new BadRequestError('BSLCUrl is required')
      }

      const response = await axios.get(BSLCUrl)
      if (response.status !== 200) {
        throw new Error('Failed to fetch the BitstringStatusListCredential')
      }

      const credential = response.data
      const encodedList = credential?.credentialSubject?.claims.encodedList
      if (!encodedList) {
        throw new Error('Encoded list not found in the credential')
      }

      let bitstring
      try {
        const compressedData = Buffer.from(encodedList, 'base64').toString('binary')
        bitstring = Array.from(compressedData)
          .map((byte) => byte.padStart(8, '0'))
          .join('')
      } catch (error) {
        throw new Error('Failed to decompress and process the encoded list')
      }

      const unusedIndexes = []
      for (let i = 0; i < bitstring.length; i++) {
        if (bitstring[i] === '0') {
          unusedIndexes.push(i)
        }
      }
      //TODO: add logic to filter from used indexs, for now returning random index with bit status as 0.
      if (unusedIndexes.length === 0) {
        throw new Error('No unused index found in the BitstringStatusList')
      }

      const randomIndex = unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)]
      return {
        index: randomIndex,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
