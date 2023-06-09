import type { DidCreate, DidResolutionResultProps } from '../types'
import { DidCreateResult, DidOperationStateActionBase, JsonTransformer, KeyType, TypedArrayEncoder } from '@aries-framework/core'
import { Agent } from '@aries-framework/core'
import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'
import { IndySdkIndyDidCreateOptions, IndySdkIndyDidRegistrar, IndySdkIndyDidResolver } from '@aries-framework/indy-sdk'
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

  @Post('/write')
  public async writeDid(
    @Body() data: DidCreate,
    @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const key = await this.agent.wallet.createKey({
        keyType: KeyType.Ed25519,
        privateKey: TypedArrayEncoder.fromString(data.seed),
      })

      const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58)
      const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16))

      console.log("did", did)

      const registerDid: IndySdkIndyDidRegistrar = new IndySdkIndyDidRegistrar()
      const createDid = await registerDid.create(this.agent.context, {
        did: `did:indy:bcovrin:${did}`,
        options: {
          submitterDid: `did:indy:bcovrin:${did}`,
          alias: 'Alias',
          role: 'ENDORSER'
        }
      });

      console.log("createDid", createDid);

      const resolverDids = `did:indy:bcovrin:${did}`
      const resolveDid: IndySdkIndyDidResolver = new IndySdkIndyDidResolver()
      const resolveIndyDid = await resolveDid.resolve(this.agent.context, resolverDids);

      console.log(`resolveIndyDid`, resolveIndyDid)
      // const resolveDidUrl = await this.agent.dids.resolve(`did:key:bcovrin:${did}`)

      // console.log("resolveDidUrl", resolveDidUrl)

      const resolveResult = await this.agent.dids.import({
        did: `did:indy:bcovrin:${did}`,
        overwrite: true,
        privateKeys: [
          {
            keyType: KeyType.Ed25519,
            privateKey: TypedArrayEncoder.fromString(data.seed),
          },
        ],
      })
      return JsonTransformer.toJSON(resolveResult);
    }
    catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })

    }
  }
}
