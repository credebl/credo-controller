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
      const key = await this.agent.wallet.createKey({ keyType: KeyType.Ed25519 })
      const resolveResult = await this.agent.dids.create({
        options: {
          endorserMode: 'internal',
          endorserDid: didCreateOptions.did,
          alias: 'Alias',
          role: 'ENDORSER',
          verkey: key.publicKeyBase58,
          useEndpointAttrib: true
        },
      });
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
