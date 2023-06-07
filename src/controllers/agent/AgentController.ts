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
    const did = '7Tw5BYsY5zoc4CysdSyDJv';
    const publicDid = await this.agent.dids.import({
      did: `did:indy:bcovrin:test:${did}`,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString('01eafa4de4e22ed4fc2ee522b6ce2731'),
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

  /**
   * Did nym registration
   * @body DidCreateOptions
   * @returns DidResolutionResult
   */
  // @Example<DidResolutionResultProps>(DidRecordExample)

  @Post('/write/did')
  public async writeDid(
    @Body() didCreateOptions: DidCreateOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const resolveResult = await this.agent.dids.create(didCreateOptions);
      return JsonTransformer.toJSON(resolveResult);
    }
    catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })

    }
  }

  /**
   * Did nym registration
   * @body DidCreateOptions
   * @returns DidResolutionResult
   */
  // @Example<DidResolutionResultProps>(DidRecordExample)

  @Post('/resolve/did/:didUrl')
  public async resolveDid(
    @Path('didUrl') didUrl: string,
    @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const resolveResult = await this.agent.dids.resolve(didUrl);
      return JsonTransformer.toJSON(resolveResult);
    }
    catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })

    }
  }
}
