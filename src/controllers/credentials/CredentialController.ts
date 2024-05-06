import type { CredentialExchangeRecordProps, CredentialProtocolVersionType, Routing } from '@aries-framework/core'

// eslint-disable-next-line import/no-extraneous-dependencies
import { LegacyIndyCredentialFormatService, V1CredentialProtocol } from '@aries-framework/anoncreds'
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  CredentialRepository,
  CredentialState,
  RecordNotFoundError,
  HandshakeProtocol,
  W3cCredentialService,
  Key,
  KeyType,
} from '@aries-framework/core'
import { Request as Req } from 'express'
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

import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Example,
  Query,
  Security,
  Request,
} from 'tsoa'

@Tags('Credentials')
// @Security('apiKey')
@Security('jwt')
@Route('/credentials')
@injectable()
export class CredentialController extends Controller {
  private outOfBandController: OutOfBandController

  public constructor(outOfBandController: OutOfBandController) {
    super()
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
    @Request() request: Req,
    @Query('threadId') threadId?: string,
    @Query('connectionId') connectionId?: string,
    @Query('state') state?: CredentialState
  ) {
    const credentialRepository = request.agent.dependencyManager.resolve(CredentialRepository)

    const credentials = await credentialRepository.findByQuery(request.agent.context, {
      connectionId,
      threadId,
      state,
    })

    return credentials.map((c) => c.toJSON())
  }

  @Get('/w3c')
  public async getAllW3c(@Request() request: Req) {
    const w3cCredentialService = await request.agent.dependencyManager.resolve(W3cCredentialService)
    return await w3cCredentialService.getAllCredentialRecords(request.agent.context)
  }

  @Get('/w3c/:id')
  public async getW3cById(@Path('id') id: string, @Request() request: Req) {
    const w3cCredentialService = await request.agent.dependencyManager.resolve(W3cCredentialService)
    return await w3cCredentialService.getCredentialRecordById(request.agent.context, id)
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
    @Request() request: Req,
    @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await request.agent.credentials.getById(credentialRecordId)
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
    @Request() request: Req,
    @Body() proposeCredentialOptions: ProposeCredentialOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await request.agent.credentials.proposeCredential({
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
    @Request() request: Req,
    // @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialProposal: AcceptCredentialProposalOptions
  ) {
    try {
      const credential = await request.agent.credentials.acceptProposal({
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
    @Request() request: Req,
    @Body() createOfferOptions: CreateOfferOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const offer = await request.agent.credentials.offerCredential({
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
    @Request() request: Req,
    @Body() outOfBandOption: CreateOfferOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      let routing: Routing
      const linkSecretIds = await request.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await request.agent.modules.anoncreds.createLinkSecret()
      }
      if (outOfBandOption?.recipientKey) {
        routing = {
          endpoints: request.agent.config.endpoints,
          routingKeys: [],
          recipientKey: Key.fromPublicKeyBase58(outOfBandOption.recipientKey, KeyType.Ed25519),
          mediatorId: undefined,
        }
      } else {
        routing = await request.agent.mediationRecipient.getRouting({})
      }
      const offerOob = await request.agent.credentials.createOffer({
        protocolVersion: outOfBandOption.protocolVersion as CredentialProtocolVersionType<[]>,
        credentialFormats: outOfBandOption.credentialFormats,
        autoAcceptCredential: outOfBandOption.autoAcceptCredential,
        comment: outOfBandOption.comment,
      })

      const credentialMessage = offerOob.message
      const outOfBandRecord = await request.agent.oob.createInvitation({
        label: outOfBandOption.label,
        handshakeProtocols: [HandshakeProtocol.Connections],
        messages: [credentialMessage],
        autoAcceptConnection: true,
        imageUrl: outOfBandOption?.imageUrl,
        routing,
      })
      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: request.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: request.agent.config.useDidSovPrefixWhereAllowed,
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
    @Request() request: Req,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialOfferOptions: CredentialOfferOptions
  ) {
    try {
      const linkSecretIds = await request.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await request.agent.modules.anoncreds.createLinkSecret()
      }
      const acceptOffer = await request.agent.credentials.acceptOffer({
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
    @Request() request: Req,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialRequestOptions: AcceptCredentialRequestOptions
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService()

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat })
      const credential = await v1CredentialProtocol.acceptRequest(request.agent.context, acceptCredentialRequestOptions)
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
    @Request() request: Req,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredential: AcceptCredential
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService()

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat })
      const credential = await v1CredentialProtocol.acceptCredential(request.agent.context, acceptCredential)
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
