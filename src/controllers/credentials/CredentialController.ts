import type { RestAgentModules } from '../../cliAgent'
import type { BitStringCredential, IndexRecord } from '../types'
import type {
  CredentialExchangeRecordProps,
  CredentialProtocolVersionType,
  CredentialStatus,
  Routing,
} from '@credo-ts/core'

import { CredentialState, Agent, W3cCredentialService, Key, KeyType, CredentialRole } from '@credo-ts/core'
import { injectable } from 'tsyringe'
import { promisify } from 'util'
import * as zlib from 'zlib'

import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, ConflictError, InternalServerError } from '../../errors/errors'
import { BIT_STRING_STATUS_INDEX_URL } from '../../utils/util'
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
      let offer
      if (createOfferOptions.credentialFormats.jsonld) {
        if (createOfferOptions.isRevocable) {
          const credentialStatus = await this.getCredentialStatus(createOfferOptions)
          createOfferOptions.credentialFormats.jsonld.credential.credentialStatus = credentialStatus
          offer = await this.agent.credentials.offerCredential(createOfferOptions)

          const credentialsIndexes = {
            index: credentialStatus.statusListIndex,
            statusListCredentialURL: credentialStatus.statusListCredential,
            id: offer.id,
          }
          await fetch(credentialStatus.statusListCredential, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credentialsIndexes }),
          })
        }
      }
      offer = await this.agent.credentials.offerCredential(createOfferOptions)
      return offer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  private async getCredentialStatus(createOfferOptions: CreateOfferOptions): Promise<CredentialStatus> {
    try {
      if (!createOfferOptions.credentialSubjectUrl || !createOfferOptions.statusPurpose) {
        throw new BadRequestError(`Please provide valid credentialSubjectUrl and statusPurpose`)
      }
      const url = createOfferOptions.credentialSubjectUrl
      const validateUrl = await this.isValidUrl(url)
      if (!validateUrl) {
        throw new BadRequestError(`Please provide a valid credentialSubjectUrl`)
      }

      const bitStringStatusListCredential = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!bitStringStatusListCredential.ok) {
        throw new InternalServerError(`${bitStringStatusListCredential.statusText}`)
      }

      const bitStringCredential = (await bitStringStatusListCredential.json()) as BitStringCredential

      if (!bitStringCredential?.credential && !bitStringCredential?.credential?.credentialSubject) {
        throw new BadRequestError(`Invalid credentialSubjectUrl`)
      }

      if (bitStringCredential?.credential?.credentialSubject?.statusPurpose !== createOfferOptions?.statusPurpose) {
        throw new BadRequestError(
          `Invalid statusPurpose! Please provide valid statusPurpose. '${createOfferOptions.statusPurpose}'`
        )
      }

      const encodedBitString = bitStringCredential.credential.credentialSubject.encodedList
      const gunzip = promisify(zlib.gunzip)

      const compressedBuffer = Buffer.from(encodedBitString, 'base64')
      const decompressedBuffer = await gunzip(compressedBuffer)
      const decodedBitString = decompressedBuffer.toString('binary')
      // const getIndex = await this.agent.genericRecords.findAllByQuery({
      //   statusListCredentialURL: createOfferOptions.credentialSubjectUrl,
      // })
      const segments = createOfferOptions.credentialSubjectUrl.split('/')
      const lastSegment = segments[segments.length - 1]
      const getIndexesList = await fetch(`${BIT_STRING_STATUS_INDEX_URL}/${lastSegment}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      let index
      const arrayIndex: number[] = []
      if (getIndexesList.status === 404) {
        index = decodedBitString.indexOf('0')
      } else {
        const getIndex = (await getIndexesList.json()) as IndexRecord[]
        getIndex.find((record) => {
          arrayIndex.push(Number(record.content.index))
        })

        index = await this.getAvailableIndex(decodedBitString, arrayIndex)
      }

      if (index === -1) {
        throw new ConflictError(
          `The provided bit string credential revocation list for ${createOfferOptions.credentialSubjectUrl} has been exhausted. Please supply a valid credentialSubjectUrl.`
        )
      }

      const credentialStatus = {
        id: `${createOfferOptions.credentialSubjectUrl}#${index}`,
        type: 'BitstringStatusListEntry',
        statusPurpose: createOfferOptions.statusPurpose,
        statusListIndex: index.toString(),
        statusListCredential: createOfferOptions.credentialSubjectUrl,
      } as unknown as CredentialStatus

      return credentialStatus
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  private async getAvailableIndex(str: string, usedIndices: number[]) {
    // Find all indices of the character '0'
    const indices = []
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '0') {
        indices.push(i)
      }
    }

    // Find the first available index that is not in the usedIndices array
    for (const index of indices) {
      if (!usedIndices.includes(index)) {
        return index
      }
    }

    // If no available index is found, return -1 or any indication of 'not found'
    return -1
  }

  private async isValidUrl(url: string) {
    try {
      new URL(url)
      return true
    } catch (err) {
      return false
    }
  }

  @Post('/create-offer-oob')
  public async createOfferOob(@Body() outOfBandOption: CreateOfferOobOptions) {
    try {
      let routing: Routing
      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }
      if (outOfBandOption?.recipientKey) {
        routing = {
          endpoints: this.agent.config.endpoints,
          routingKeys: [],
          recipientKey: Key.fromPublicKeyBase58(outOfBandOption.recipientKey, KeyType.Ed25519),
          mediatorId: undefined,
        }
      } else {
        routing = await this.agent.mediationRecipient.getRouting({})
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
        routing,
      })
      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
        recipientKey: outOfBandOption?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 },
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
}
