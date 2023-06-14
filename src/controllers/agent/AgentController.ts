import type { AgentInfo } from '../types'

import { Agent, DidCreateOptions, JsonTransformer, KeyType, TypedArrayEncoder } from '@aries-framework/core'
import { Body, Controller, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

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
    const did = '2XKsaGBrgRoAqNcSycUvKK';
    const publicDid = await this.agent.dids.import({
      did: `did:indy:bcovrin:${did}`,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString('testseed000000000000001100000001'),
        }
      ],
      overwrite: true
    })
    return {
      label: this.agent.config.label,
      endpoints: this.agent.config.endpoints,
      isInitialized: this.agent.isInitialized,
      publicDid
    }
  }
}
