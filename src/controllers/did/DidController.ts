import type { DidCreateOptions, DidResolutionResultProps } from '../types'
import { JsonTransformer } from '@aries-framework/core'
import { Agent } from '@aries-framework/core'
import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import { Did, DidRecordExample } from '../examples'

@Tags('Dids')
@Route('/dids')
@injectable()
export class DidController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Resolves did and returns did resolution result
   * @param did Decentralized Identifier
   * @returns DidResolutionResult
   */
  @Example<DidResolutionResultProps>(DidRecordExample)
  @Get('/:did')
  public async getDidRecordByDid(@Path('did') did: Did) {
    const resolveResult = await this.agent.dids.resolve(did)

    if (!resolveResult.didDocument) {
      this.setStatus(500)
      return { resolveResult }
    }

    return { ...resolveResult, didDocument: resolveResult.didDocument.toJSON() }
  }

  /**
   * Did nym registration
   * @body DidCreateOptions
   * @returns DidResolutionResult
   */
  // @Example<DidResolutionResultProps>(DidRecordExample)

  @Post('/:write')
  public async writeDid(
    @Body() data: DidCreateOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const resolveResult = await this.agent.dids.create(data);
      return JsonTransformer.toJSON(resolveResult);
    }
    catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })

    }
  }
}
