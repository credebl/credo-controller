import type { DidCreateOptions, DidResolutionResultProps } from '../types'
import { DidCreateResult, DidOperationStateActionBase, JsonTransformer, KeyType, TypedArrayEncoder } from '@aries-framework/core'
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

  @Post('/write')
  public async writeDid(
    @Body() data: DidCreateOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {

      console.log("STARTINGGG")
      // testseed000000000006000000067890
      // const resolveResult = await this.agent.dids.create({
      //   "method": "indy",
      //   "options": {
      //     alias: "Hello",
      //     submitterDid: 'did:indy:bcovrin:AtD4JwyJnd57MpuQ3BTDhy',
      //     role: 'ENDORSER',
      //   },
      //   "secret": {
      //     "privateKey": TypedArrayEncoder.fromString(data.seed)
      //   }
      // });
      // console.log(JSON.stringify(resolveResult));
      const key = await this.agent.wallet.createKey({
        keyType: KeyType.Ed25519,
        privateKey: TypedArrayEncoder.fromString(data.seed)
      });
      console.log("KEY CREATED");
      const unqualifiedIndyDid = TypedArrayEncoder.toBase58(key.publicKey.slice(0, 16))
      console.log("UNQUALIFIEDDID: ", unqualifiedIndyDid);
      const resolveResult = await this.agent.dids.create({
        method: 'indy',
        options: {
          alias: 'Hi',
          submitterDid: `did:indy:bcovrin:${unqualifiedIndyDid}`,
          role: 'ENDORSER'
        },
        // secret: {
        //   privateKey: TypedArrayEncoder.fromString(data.seed)
        // }
      });
      console.log("resolved: ---- ", JSON.stringify(resolveResult));
      // if (resolveResult.didState.did) {
      //   console.log("Inside IF");
      //   const importing = await this.agent.dids.import({ did: resolveResult.didState.did, overwrite: true });
      //   console.log("Done with ", importing);
      // }
      return JsonTransformer.toJSON(resolveResult);

    }
    catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })

    }
  }

  @Get('/')
  public async getDids() {
    const createdDids = await this.agent.dids.getCreatedDids({})
    console.log("Created dids: ", createdDids);
    return createdDids;
  }
}


