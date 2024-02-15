import type { AgentInfo } from '../types'

import { Agent } from '@aries-framework/core'
import { injectable } from 'tsyringe'

import { Controller, Delete, Get, Route, Tags, Security } from 'tsoa'

@Tags('Agent')
@Route('/agent')
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
      publicDid: undefined,
    }
  }

  /**
   * Delete wallet
   */
  @Security('apiKey')
  @Delete('/wallet')
  public async deleteWallet() {
    const deleteWallet = await this.agent.wallet.delete()
    return deleteWallet
  }
}
