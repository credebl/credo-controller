import type { OutOfBandInvitationProps, OutOfBandRecordWithInvitationProps } from '../examples'
import type { AgentMessageType, RecipientKeyOption } from '../types'
import type { ConnectionRecordProps, CreateLegacyInvitationConfig, Routing } from '@aries-framework/core'

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  AgentMessage,
  JsonTransformer,
  OutOfBandInvitation,
  RecordNotFoundError,
  Key,
  KeyType,
} from '@aries-framework/core'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import { ConnectionRecordExample, outOfBandInvitationExample, outOfBandRecordExample, RecordId } from '../examples'
import {
  AcceptInvitationConfig,
  ReceiveInvitationByUrlProps,
  ReceiveInvitationProps,
  CreateInvitationOptions,
} from '../types'

import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Tags,
  TsoaResponse,
  Security,
  Res,
} from 'tsoa'

@Tags('Out Of Band')
// @Security('apiKey')
@Security('jwt')
@Route('/oob')
@injectable()
export class OutOfBandController extends Controller {
  /**
   * Retrieve all out of band records
   * @param invitationId invitation identifier
   * @returns OutOfBandRecord[]
   */
  @Example<OutOfBandRecordWithInvitationProps[]>([outOfBandRecordExample])
  @Get()
  public async getAllOutOfBandRecords(@Request() request: Req, @Query('invitationId') invitationId?: RecordId) {
    let outOfBandRecords = await request.agent.oob.getAll()

    if (invitationId) outOfBandRecords = outOfBandRecords.filter((o) => o.outOfBandInvitation.id === invitationId)

    return outOfBandRecords.map((c) => c.toJSON())
  }

  /**
   * Retrieve an out of band record by id
   * @param recordId record identifier
   * @returns OutOfBandRecord
   */
  @Example<OutOfBandRecordWithInvitationProps>(outOfBandRecordExample)
  @Get('/:outOfBandId')
  public async getOutOfBandRecordById(
    @Request() request: Req,
    @Path('outOfBandId') outOfBandId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>
  ) {
    const outOfBandRecord = await request.agent.oob.findById(outOfBandId)

    if (!outOfBandRecord)
      return notFoundError(404, { reason: `Out of band record with id "${outOfBandId}" not found.` })

    return outOfBandRecord.toJSON()
  }

  /**
   * Creates an outbound out-of-band record containing out-of-band invitation message defined in
   * Aries RFC 0434: Out-of-Band Protocol 1.1.
   * @param config configuration of how out-of-band invitation should be created
   * @returns Out of band record
   */
  @Example<{
    invitationUrl: string
    invitation: OutOfBandInvitationProps
    outOfBandRecord: OutOfBandRecordWithInvitationProps
  }>({
    invitationUrl: 'string',
    invitation: outOfBandInvitationExample,
    outOfBandRecord: outOfBandRecordExample,
  })
  @Post('/create-invitation')
  public async createInvitation(
    @Request() request: Req,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() config: CreateInvitationOptions // props removed because of issues with serialization
  ) {
    try {
      const outOfBandRecord = await request.agent.oob.createInvitation(config)
      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: request.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: request.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates an outbound out-of-band record in the same way how `createInvitation` method does it,
   * but it also converts out-of-band invitation message to an "legacy" invitation message defined
   * in RFC 0160: Connection Protocol and returns it together with out-of-band record.
   *
   * @param config configuration of how a invitation should be created
   * @returns out-of-band record and invitation
   */
  @Example<{ invitation: OutOfBandInvitationProps; outOfBandRecord: OutOfBandRecordWithInvitationProps }>({
    invitation: outOfBandInvitationExample,
    outOfBandRecord: outOfBandRecordExample,
  })
  @Post('/create-legacy-invitation')
  public async createLegacyInvitation(
    @Request() request: Req,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() config?: Omit<CreateLegacyInvitationConfig, 'routing'> & RecipientKeyOption
  ) {
    try {
      let routing: Routing
      if (config?.recipientKey) {
        routing = {
          endpoints: request.agent.config.endpoints,
          routingKeys: [],
          recipientKey: Key.fromPublicKeyBase58(config.recipientKey, KeyType.Ed25519),
          mediatorId: undefined,
        }
      } else {
        routing = await request.agent.mediationRecipient.getRouting({})
      }
      const { outOfBandRecord, invitation } = await request.agent.oob.createLegacyInvitation({
        ...config,
        routing,
      })
      return {
        invitationUrl: invitation.toUrl({
          domain: request.agent.config.endpoints[0],
          useDidSovPrefixWhereAllowed: request.agent.config.useDidSovPrefixWhereAllowed,
        }),
        invitation: invitation.toJSON({
          useDidSovPrefixWhereAllowed: request.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
        ...(config?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 }),
      }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates a new connectionless legacy invitation.
   *
   * @param config configuration of how a connection invitation should be created
   * @returns a message and a invitationUrl
   */
  @Example<{ message: AgentMessageType; invitationUrl: string }>({
    message: {
      '@id': 'eac4ff4e-b4fb-4c1d-aef3-b29c89d1cc00',
      '@type': 'https://didcomm.org/connections/1.0/invitation',
    },
    invitationUrl: 'http://example.com/invitation_url',
  })
  @Post('/create-legacy-connectionless-invitation')
  public async createLegacyConnectionlessInvitation(
    @Request() request: Req,
    @Body()
    config: {
      recordId: string
      message: AgentMessageType
      domain: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const agentMessage = JsonTransformer.fromJSON(config.message, AgentMessage)

      return await request.agent.oob.createLegacyConnectionlessInvitation({
        ...config,
        message: agentMessage,
      })
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `connection with connection id "${config.recordId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates inbound out-of-band record and assigns out-of-band invitation message to it if the
   * message is valid.
   *
   * @param invitation either OutOfBandInvitation or ConnectionInvitationMessage
   * @param config config for handling of invitation
   * @returns out-of-band record and connection record if one has been created.
   */
  @Example<{ outOfBandRecord: OutOfBandRecordWithInvitationProps; connectionRecord: ConnectionRecordProps }>({
    outOfBandRecord: outOfBandRecordExample,
    connectionRecord: ConnectionRecordExample,
  })
  @Post('/receive-invitation')
  public async receiveInvitation(
    @Request() request: Req,
    @Body() invitationRequest: ReceiveInvitationProps,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { invitation, ...config } = invitationRequest

    try {
      const invite = new OutOfBandInvitation({ ...invitation, handshakeProtocols: invitation.handshake_protocols })
      const { outOfBandRecord, connectionRecord } = await request.agent.oob.receiveInvitation(invite, config)

      return {
        outOfBandRecord: outOfBandRecord.toJSON(),
        connectionRecord: connectionRecord?.toJSON(),
      }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates inbound out-of-band record and assigns out-of-band invitation message to it if the
   * message is valid.
   *
   * @param invitationUrl invitation url
   * @param config config for handling of invitation
   * @returns out-of-band record and connection record if one has been created.
   */
  @Example<{ outOfBandRecord: OutOfBandRecordWithInvitationProps; connectionRecord: ConnectionRecordProps }>({
    outOfBandRecord: outOfBandRecordExample,
    connectionRecord: ConnectionRecordExample,
  })
  @Post('/receive-invitation-url')
  public async receiveInvitationFromUrl(
    @Request() request: Req,
    @Body() invitationRequest: ReceiveInvitationByUrlProps,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { invitationUrl, ...config } = invitationRequest

    try {
      const linkSecretIds = await request.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await request.agent.modules.anoncreds.createLinkSecret()
      }
      const { outOfBandRecord, connectionRecord } = await request.agent.oob.receiveInvitationFromUrl(
        invitationUrl,
        config
      )
      return {
        outOfBandRecord: outOfBandRecord.toJSON(),
        connectionRecord: connectionRecord?.toJSON(),
      }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a connection invitation as invitee (by sending a connection request message) for the connection with the specified connection id.
   * This is not needed when auto accepting of connections is enabled.
   */
  @Example<{ outOfBandRecord: OutOfBandRecordWithInvitationProps; connectionRecord: ConnectionRecordProps }>({
    outOfBandRecord: outOfBandRecordExample,
    connectionRecord: ConnectionRecordExample,
  })
  @Post('/:outOfBandId/accept-invitation')
  public async acceptInvitation(
    @Request() request: Req,
    @Path('outOfBandId') outOfBandId: RecordId,
    @Body() acceptInvitationConfig: AcceptInvitationConfig,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { outOfBandRecord, connectionRecord } = await request.agent.oob.acceptInvitation(
        outOfBandId,
        acceptInvitationConfig
      )

      return {
        outOfBandRecord: outOfBandRecord.toJSON(),
        connectionRecord: connectionRecord?.toJSON(),
      }
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `mediator with mediatorId ${acceptInvitationConfig?.mediatorId} not found`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Deletes an out of band record from the repository.
   *
   * @param outOfBandId Record identifier
   */
  @Delete('/:outOfBandId')
  public async deleteOutOfBandRecord(
    @Request() request: Req,
    @Path('outOfBandId') outOfBandId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      this.setStatus(204)
      await request.agent.oob.deleteById(outOfBandId)
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, { reason: `Out of band record with id "${outOfBandId}" not found.` })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
