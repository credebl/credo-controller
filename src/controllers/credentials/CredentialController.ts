import { AutoAcceptCredential, ConnectionRecord, ConnectionState, CredentialExchangeRecord, CredentialExchangeRecordProps, CredentialProtocolVersionType, CustomConnectionTags, DefaultConnectionTags, DidExchangeRole, DidExchangeState, utils } from '@aries-framework/core'

import { CredentialRepository, CredentialState, Agent, RecordNotFoundError } from '@aries-framework/core'
import { Body, Controller, Delete, Get, Path, Post, Res, Route, Tags, TsoaResponse, Example, Query } from 'tsoa'
import { injectable } from 'tsyringe'
import {
  LegacyIndyCredentialFormatService,
  V1CredentialProtocol
} from '@aries-framework/anoncreds'

import { CredentialExchangeRecordExample, RecordId } from '../examples'
import {
  AcceptCredentialRequestOptions,
  OfferCredentialOptions,
  ProposeCredentialOptions,
  AcceptCredentialProposalOptions,
  AcceptCredentialOfferOptions,
  CreateOfferOptions,
  AcceptCredential,
} from '../types'



@Tags('Credentials')
@Route('/credentials')
@injectable()
export class CredentialController extends Controller {
  private agent: Agent
  // private v1CredentialProtocol: V1CredentialProtocol

  public constructor(agent: Agent) {
    super()
    this.agent = agent
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
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      const credential = await v1CredentialProtocol.getById(this.agent.context, credentialRecordId)
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
  //  * Deletes a credential exchange record in the credential repository.
  //  *
  //  * @param credentialRecordId
  //  */
  // @Delete('/:credentialRecordId')
  // public async deleteCredential(
  //   @Path('credentialRecordId') credentialRecordId: RecordId,
  //   @Res() notFoundError: TsoaResponse<404, { reason: string }>,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   try {
  //     this.setStatus(204)
  //     await this.v1CredentialProtocol.delete(credentialRecordId)
  //   } catch (error) {
  //     if (error instanceof RecordNotFoundError) {
  //       return notFoundError(404, {
  //         reason: `credential with credential record id "${credentialRecordId}" not found.`,
  //       })
  //     }
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

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
    @Body() options: ProposeCredentialOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      const credential = await v1CredentialProtocol.createProposal(this.agent.context, options)
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connection record id "${options.connectionId}" not found.`,
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
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      const credential = await v1CredentialProtocol.acceptProposal(this.agent.context, acceptCredentialProposal)

      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialProposal.credentialRecord.id}" not found.`,
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
      // const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      // const connectionRecord: ConnectionRecord = new ConnectionRecord({
      //   id: createOfferOptions.connectionId,
      //   state: DidExchangeState.Completed,
      //   role: DidExchangeRole.Responder
      // });

      // const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      // const offer = await v1CredentialProtocol.createOffer(this.agent.context, { credentialFormats: createOfferOptions.credentialFormats, connectionRecord: connectionRecord })
      const offer = await this.agent.credentials.offerCredential({
        connectionId: createOfferOptions.connectionId,
        protocolVersion: 'v1' as CredentialProtocolVersionType<[]>,
        credentialFormats: createOfferOptions.credentialFormats,
        autoAcceptCredential: createOfferOptions.autoAcceptCredential
      })
      return offer;
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Initiate a new credential exchange as issuer by sending a offer credential message
   * to the connection with the specified connection id.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  // @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  // @Post('/offer-credential')
  // public async offerCredential(
  //   @Body() options: OfferCredentialOptions,
  //   @Res() notFoundError: TsoaResponse<404, { reason: string }>,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   try {
  //     const credential = await this.v1CredentialProtocol.offerCredential(options)
  //     return credential.toJSON()
  //   } catch (error) {
  //     if (error instanceof RecordNotFoundError) {
  //       return notFoundError(404, {
  //         reason: `connection with connection record id "${options.connectionId}" not found.`,
  //       })
  //     }
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

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
    @Body() acceptCredentialOfferOptions: AcceptCredentialOfferOptions
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
        comment: acceptCredentialOfferOptions.comment
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
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
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
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
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
