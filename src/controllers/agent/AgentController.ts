import type { AgentInfo } from '../types'

import { Agent, DidCreateOptions, JsonTransformer, KeyType, TypedArrayEncoder } from '@aries-framework/core'
import { Body, Controller, Delete, Get, Path, Post, Res, Route, Tags, TsoaResponse, Security } from 'tsoa'
import { injectable } from 'tsyringe'

@Tags('Agent')
@Route('/agent')
@Security('apiKey')
@injectable()
export class AgentController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Retrieve basic agent information
   */
  @Get('/')
  public async getAgentInfo(): Promise<AgentInfo> {
    return {
      label: this.agent.config.label,
      endpoints: this.agent.config.endpoints,
      isInitialized: this.agent.isInitialized,
      publicDid: undefined
    }
  }

  /**
   * Delete wallet
   */
  @Security('apiKey')
  @Delete('/wallet')
  public async deleteWallet() {
    const deleteWallet = await this.agent.wallet.delete();
    return deleteWallet
  }
}
