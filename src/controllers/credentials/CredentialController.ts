import type { RestAgentModules } from '../../cliAgent'
import type { CredentialExchangeRecordProps, CredentialProtocolVersionType, Routing } from '@credo-ts/core'

import { LegacyIndyCredentialFormatService, V1CredentialProtocol } from '@credo-ts/anoncreds'
import {
  CredentialRepository,
  CredentialState,
  Agent,
  RecordNotFoundError,
  HandshakeProtocol,
  W3cCredentialService,
  Key,
  KeyType,
} from '@credo-ts/core'
import { injectable } from 'tsyringe'

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
} from '../types'

import { Body, Controller, Get, Path, Post, Res, Route, Tags, TsoaResponse, Example, Query, Security } from 'tsoa'

@Tags('Credentials')
@Security('apiKey')
@Route('/credentials')
@injectable()
export class CredentialController extends Controller {
  private agent: Agent<RestAgentModules>
  private outOfBandController: OutOfBandController

  // private v1CredentialProtocol: V1CredentialProtocol

  public constructor(agent: Agent<RestAgentModules>, outOfBandController: OutOfBandController) {
    super()
    this.agent = agent
    this.outOfBandController = outOfBandController
    // this.v1CredentialProtocol = v1CredentialProtocol
  }

  /**
   * Retrieve all credential exchange records
   *
   * @returns CredentialExchangeRecord[]
   */
  @Example<CredentialExchangeRecordProps[]>([CredentialExchangeRecordExample])
  @Get('/')
  public async getAllCredentials(
    @Query('threadId') threadId?: string,
    @Query('connectionId') connectionId?: string,
    @Query('state') state?: CredentialState
  ) {
    const credentialRepository = this.agent.dependencyManager.resolve(CredentialRepository)

    const credentials = await credentialRepository.findByQuery(this.agent.context, {
      connectionId,
      threadId,
      state,
    })

    return credentials.map((c) => c.toJSON())
  }

  @Get('/w3c')
  public async getAllW3c() {
    const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
    return await w3cCredentialService.getAllCredentialRecords(this.agent.context)
  }

  @Get('/w3c/:id')
  public async getW3cById(@Path('id') id: string) {
    const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
    return await w3cCredentialService.getCredentialRecordById(this.agent.context, id)
  }

  /**
   * Retrieve credential exchange record by credential record id
   *
   * @param credentialRecordId
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Get('/:credentialRecordId')
  public async getCredentialById(
    @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await this.agent.credentials.getById(credentialRecordId)
      return credential.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async proposeCredential(
    @Body() proposeCredentialOptions: ProposeCredentialOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await this.agent.credentials.proposeCredential({
        connectionId: proposeCredentialOptions.connectionId,
        protocolVersion: 'v1' as CredentialProtocolVersionType<[]>,
        credentialFormats: proposeCredentialOptions.credentialFormats,
        autoAcceptCredential: proposeCredentialOptions.autoAcceptCredential,
        comment: proposeCredentialOptions.comment,
      })
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connection record id "${proposeCredentialOptions.connectionId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async acceptProposal(
    // @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialProposal: AcceptCredentialProposalOptions
  ) {
    try {
      const credential = await this.agent.credentials.acceptProposal({
        credentialRecordId: acceptCredentialProposal.credentialRecordId,
        credentialFormats: acceptCredentialProposal.credentialFormats,
        autoAcceptCredential: acceptCredentialProposal.autoAcceptCredential,
        comment: acceptCredentialProposal.comment,
      })

      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialProposal.credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async createOffer(
    @Body() createOfferOptions: CreateOfferOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const offer = await this.agent.credentials.offerCredential({
        connectionId: createOfferOptions.connectionId,
        protocolVersion: createOfferOptions.protocolVersion as CredentialProtocolVersionType<[]>,
        credentialFormats: createOfferOptions.credentialFormats,
        autoAcceptCredential: createOfferOptions.autoAcceptCredential,
      })
      return offer
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/create-offer-oob')
  public async createOfferOob(
    @Body() outOfBandOption: CreateOfferOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
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
        handshakeProtocols: [HandshakeProtocol.Connections],
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
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async acceptOffer(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialOfferOptions: CredentialOfferOptions
  ) {
    try {
      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }
      const acceptOffer = await this.agent.credentials.acceptOffer({
        credentialRecordId: acceptCredentialOfferOptions.credentialRecordId,
        credentialFormats: acceptCredentialOfferOptions.credentialFormats,
        autoAcceptCredential: acceptCredentialOfferOptions.autoAcceptCredential,
        comment: acceptCredentialOfferOptions.comment,
      })
      return acceptOffer
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialOfferOptions.credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async acceptRequest(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialRequestOptions: AcceptCredentialRequestOptions
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService()

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat })
      const credential = await v1CredentialProtocol.acceptRequest(this.agent.context, acceptCredentialRequestOptions)
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record "${acceptCredentialRequestOptions.credentialRecord}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
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
  public async acceptCredential(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredential: AcceptCredential
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService()

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat })
      const credential = await v1CredentialProtocol.acceptCredential(this.agent.context, acceptCredential)
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredential.credentialRecord}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
