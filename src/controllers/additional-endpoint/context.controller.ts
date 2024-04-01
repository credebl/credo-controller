/* eslint-disable @typescript-eslint/no-unused-vars */
// import type { OutOfBandInvitationProps, OutOfBandRecordWithInvitationProps } from '../examples'
import type { OutOfBandInvitationProps, OutOfBandRecordWithInvitationProps } from '../examples'
// eslint-disable-next-line import/order
import type { RecipientKeyOption } from '../types' //   AgentMessageType,
// import type { ConnectionRecordProps, CreateLegacyInvitationConfig, Routing } from '@aries-framework/core'

import type { CreateLegacyInvitationConfig, Routing } from '@aries-framework/core'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { GenericRecord } from '@aries-framework/core/build/modules/generic-records/repository/GenericRecord'

import {
  //   AgentMessage,
  //   JsonTransformer,
  //   OutOfBandInvitation,
  Agent,
  Key,
  KeyType,
  //   RecordNotFoundError,
  //   Key,
  //   KeyType,
} from '@aries-framework/core'
import { injectable } from 'tsyringe'

// import { ConnectionRecordExample, outOfBandInvitationExample, outOfBandRecordExample, RecordId } from '../examples'
// import {
//   AcceptInvitationConfig,
//   ReceiveInvitationByUrlProps,
//   ReceiveInvitationProps,
//   CreateInvitationOptions,
// } from '../types'

import { outOfBandInvitationExample, outOfBandRecordExample } from '../examples'

import {
  Body,
  Controller,
  // Delete,
  Example,
  Get,
  Path,
  Post,
  // Query,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Security,
} from 'tsoa'

@Tags('Out Of Band')
// @Security('authorization')
@Route('/testEndpoint')
@injectable()
export class ContextController extends Controller {
  // private agent: Agent
  // public constructor(agent: Agent) {
  //   super()
  //   this.agent = agent
  // }
  // @Get('/get-token')
  // public async getAgentToken(): Promise<GenericRecord[]> {
  //   const agentDetails = await this.agent.genericRecords.getAll()
  //   return agentDetails
  // }
  // This is multi-tenant invitation endpoint
  // @Security('apiKey')
  // @Post('/create-legacy-invitation/:tenantId')
  // public async createLegacyInvitation(
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>,
  //   @Path('tenantId') tenantId: string,
  //   @Body()
  //   config?: Omit<CreateOutOfBandInvitationConfig, 'routing' | 'appendedAttachments' | 'messages'> & RecipientKeyOption // props removed because of issues with serialization
  // ) {
  //   let getInvitation
  //   try {
  //     let routing: Routing
  //     await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
  //       if (config?.recipientKey) {
  //         routing = {
  //           endpoints: tenantAgent.config.endpoints,
  //           routingKeys: [],
  //           recipientKey: Key.fromPublicKeyBase58(config.recipientKey, KeyType.Ed25519),
  //           mediatorId: undefined,
  //         }
  //       } else {
  //         routing = await tenantAgent.mediationRecipient.getRouting({})
  //       }
  //       const { outOfBandRecord, invitation } = await tenantAgent.oob.createLegacyInvitation({ ...config, routing })
  //       getInvitation = {
  //         invitationUrl: invitation.toUrl({
  //           domain: this.agent.config.endpoints[0],
  //           useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //         }),
  //         invitation: invitation.toJSON({
  //           useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //         }),
  //         outOfBandRecord: outOfBandRecord.toJSON(),
  //         ...(config?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 }),
  //       }
  //     })
  //     return getInvitation
  //   } catch (error) {
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }
  // This is dedicated agent invitation endpoint
  /**
   * Creates an outbound out-of-band record in the same way how `createInvitation` method does it,
   * but it also converts out-of-band invitation message to an "legacy" invitation message defined
   * in RFC 0160: Connection Protocol and returns it together with out-of-band record.
   *
   * @param config configuration of how a invitation should be created
   * @returns out-of-band record and invitation
   */
  // @Example<{ invitation: OutOfBandInvitationProps; outOfBandRecord: OutOfBandRecordWithInvitationProps }>({
  //   invitation: outOfBandInvitationExample,
  //   outOfBandRecord: outOfBandRecordExample,
  // })
  // @Post('/create-legacy-invitation')
  // public async createLegacyInvitation(
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>,
  //   @Body() config?: Omit<CreateLegacyInvitationConfig, 'routing'> & RecipientKeyOption
  // ) {
  //   try {
  //     let routing: Routing
  //     if (config?.recipientKey) {
  //       routing = {
  //         endpoints: this.agent.config.endpoints,
  //         routingKeys: [],
  //         recipientKey: Key.fromPublicKeyBase58(config.recipientKey, KeyType.Ed25519),
  //         mediatorId: undefined,
  //       }
  //     } else {
  //       routing = await this.agent.mediationRecipient.getRouting({})
  //     }
  //     const { outOfBandRecord, invitation } = await this.agent.oob.createLegacyInvitation({
  //       ...config,
  //       routing,
  //     })
  //     return {
  //       invitationUrl: invitation.toUrl({
  //         domain: this.agent.config.endpoints[0],
  //         useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //       }),
  //       invitation: invitation.toJSON({
  //         useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //       }),
  //       outOfBandRecord: outOfBandRecord.toJSON(),
  //       ...(config?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 }),
  //     }
  //   } catch (error) {
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }
  // Create a common function that calls createLegacyInvitation
  /**
   * Creates an outbound out-of-band record in the same way how `createInvitation` method does it,
   * but it also converts out-of-band invitation message to an "legacy" invitation message defined
   * in RFC 0160: Connection Protocol and returns it together with out-of-band record.
   *
   * @param config configuration of how a invitation should be created
   * @returns out-of-band record and invitation
   */
  // @Example<{ invitation: OutOfBandInvitationProps; outOfBandRecord: OutOfBandRecordWithInvitationProps }>({
  //   invitation: outOfBandInvitationExample,
  //   outOfBandRecord: outOfBandRecordExample,
  // })
  // @Post('/create-legacy-invitation')
  // public async createLegacyInvitation(
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>,
  //   @Body() config?: Omit<CreateLegacyInvitationConfig, 'routing'> & RecipientKeyOption
  // ) {
  //   try {
  //     let routing: Routing
  //     if (config?.recipientKey) {
  //       routing = {
  //         endpoints: this.agent.config.endpoints,
  //         routingKeys: [],
  //         recipientKey: Key.fromPublicKeyBase58(config.recipientKey, KeyType.Ed25519),
  //         mediatorId: undefined,
  //       }
  //     } else {
  //       routing = await this.agent.mediationRecipient.getRouting({})
  //     }
  //     const { outOfBandRecord, invitation } = await this.agent.oob.createLegacyInvitation({
  //       ...config,
  //       routing,
  //     })
  //     return {
  //       invitationUrl: invitation.toUrl({
  //         domain: this.agent.config.endpoints[0],
  //         useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //       }),
  //       invitation: invitation.toJSON({
  //         useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
  //       }),
  //       outOfBandRecord: outOfBandRecord.toJSON(),
  //       ...(config?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 }),
  //     }
  //   } catch (error) {
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }
}
