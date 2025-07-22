import { Agent } from '@credo-ts/core'
import { OpenId4VcIssuanceSessionState } from '@credo-ts/openid4vc'
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Route, Tags, Security } from 'tsoa'
import { injectable } from 'tsyringe'

// eslint-disable-next-line import/order
import ErrorHandlingService from '../../../errorHandlingService'

// import { AgentWithRootOrTenant } from '../../types/agent'
import { OpenId4VcIssuanceSessionsCreateOffer } from '../types/issuer.types'

import { issuanceSessionService } from './issuance-sessions.service'

@Tags('oid4vc issuance sessions')
@Route('/openid4vc/issuance-sessions')
@Security('apiKey')
@injectable()
export class IssuanceSessionsController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }
  /**
   * Creates a credential offer with the specified credential configurations and authorization type.
   */
  @Post('/create-credential-offer')
  public async createCredentialOffer(
    // @Request() request: any,
    @Body() options: OpenId4VcIssuanceSessionsCreateOffer,
  ) {
    try {
      //   const agent = 'rootAgent' in request ? request.rootAgent : request.tenantAgent
      const agent = this.agent
      return await issuanceSessionService.createCredentialOffer(options, agent)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Get issuance details by issuance SessionId
   */
  @Get('/:issuanceSessionId')
  public async getIssuanceSessionsById(@Request() request: any, @Path('issuanceSessionId') issuanceSessionId: string) {
    try {
      const agent = 'rootAgent' in request ? request.rootAgent : request.tenantAgent
      return await issuanceSessionService.getIssuanceSessionsById(agent, issuanceSessionId)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Fetch all issuance sessions by query
   */
  @Get('/')
  public async getIssuanceSessionsByQuery(
    // @Request() request: AgentWithRootOrTenant,
    @Query() cNonce?: string,
    @Query() publicIssuerId?: string,
    @Query() preAuthorizedCode?: string,
    @Query() state?: OpenId4VcIssuanceSessionState,
    @Query() credentialOfferUri?: string,
    @Query() authorizationCode?: string,
  ) {
    try {
      const agent = this.agent
      return await issuanceSessionService.getIssuanceSessionsByQuery(
        agent,
        cNonce,
        publicIssuerId,
        preAuthorizedCode,
        state,
        credentialOfferUri,
        authorizationCode,
      )
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Update issuance session metadata by session ID
   */
  @Put('/:issuanceSessionId')
  public async updateSessionById(
    // @Request() request: AgentWithRootOrTenant,
    @Path('issuanceSessionId') issuanceSessionId: string,
    @Body() metadata: Record<string, unknown>,
  ) {
    try {
      //   const agent = 'rootAgent' in request ? request.rootAgent : request.tenantAgent
      const agent = this.agent
      return await issuanceSessionService.updateSessionIssuanceMetadataById(agent, issuanceSessionId, metadata)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Delete issuance session by session ID
   */
  @Delete('/:issuanceSessionId')
  public async deleteIssuanceSessionById(
    // @Request() request: AgentWithRootOrTenant,
    @Path('issuanceSessionId') issuanceSessionId: string,
  ) {
    try {
      //   const agent = 'rootAgent' in request ? request.rootAgent : request.tenantAgent
      const agent = this.agent
      await issuanceSessionService.deleteById(agent, issuanceSessionId)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
