import type { DidResolutionResultProps } from '../types'
import type { KeyDidCreateOptions } from '@aries-framework/core'

import {
  KeyType,
  TypedArrayEncoder,
  DidDocumentBuilder,
  getEd25519VerificationKey2018,
  Agent,
} from '@aries-framework/core'
import axios from 'axios'
import { injectable } from 'tsyringe'

import { BCOVRIN_REGISTER_URL, INDICIO_NYM_URL } from '../../utils/util'
import { Did, DidRecordExample } from '../examples'
import { DidCreate } from '../types'

import { Body, Controller, Example, Get, Path, Post, Res, Route, Security, Tags, TsoaResponse } from 'tsoa'

@Tags('Dids')
@Route('/dids')
@Security('apiKey')
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
    const importDid = await this.agent.dids.import({
      did,
      overwrite: true,
    })
    if (!resolveResult.didDocument) {
      this.setStatus(500)
      return { importDid }
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
  public async writeDid(@Body() data: DidCreate, @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      data.method = data.method || 'bcovrin:testnet'
      data.role = data.role || 'endorser'

      const didMethod = `did:indy:${data.method}`

      if (data.method.includes('bcovrin')) {
        return this.handleBcovrin(data, didMethod)
      } else if (data.method.includes('indicio')) {
        return this.handleIndicio(data, didMethod)
      } else {
        throw new Error('Invalid did method')
      }
    } catch (error) {
      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  private async handleBcovrin(data: DidCreate, didMethod: string) {
    if (data?.role?.toLowerCase() === 'endorser') {
      if (data.did) {
        await this.importDid(didMethod, data.did, data.seed)
        return { did: `${didMethod}:${data.did}` }
      } else {
        const res = await axios.post(BCOVRIN_REGISTER_URL, { role: 'ENDORSER', alias: 'Alias', seed: data.seed })
        const { did } = res?.data || {}
        await this.importDid(didMethod, did, data.seed)
        return { did: `${didMethod}:${did}` }
      }
    } else {
      if (!data.endorserDid) {
        throw new Error('Please provide the endorser DID')
      }
      const didCreateTxResult = await this.createEndorserDid(data.endorserDid)
      return { did: didCreateTxResult.didState.did }
    }
  }

  private async handleIndicio(data: DidCreate, didMethod: string) {
    if (data?.role?.toLowerCase() === 'endorser') {
      if (data.did) {
        await this.importDid(didMethod, data.did, data.seed)
        return { did: `${didMethod}:${data.did}` }
      } else {
        const method = data.method || 'indicio:testnet'
        const key = await this.createIndicioKey(data.seed, method)
        const res = await axios.post(INDICIO_NYM_URL, key)
        if (res.data.statusCode === 200) {
          await this.importDid(didMethod, key.did, data.seed)
          return { did: `${didMethod}:${key.did}` }
        }
      }
    } else {
      if (!data.endorserDid) {
        throw new Error('Please provide the endorser DID')
      }
      const didCreateTxResult = await this.createEndorserDid(data.endorserDid)
      return didCreateTxResult
    }
  }

  private async createEndorserDid(endorserDid: string) {
    return this.agent.dids.create({
      method: 'indy',
      options: {
        endorserMode: 'external',
        endorserDid: endorserDid || '',
      },
    })
  }

  private async createIndicioKey(seed: string, method: string) {
    const key = await this.agent.wallet.createKey({
      privateKey: TypedArrayEncoder.fromString(seed),
      keyType: KeyType.Ed25519,
    })

    const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58)
    const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16))

    let body
    if (method === 'indicio:testnet') {
      body = {
        network: 'testnet',
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      }
    } else if (method === 'indicio:demonet') {
      body = {
        network: 'demonet',
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      }
    } else {
      throw new Error('Please provide a valid did method')
    }
    return body
  }

  private async importDid(didMethod: string, did: string, seed: string) {
    await this.agent.dids.import({
      did: `${didMethod}:${did}`,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(seed),
        },
      ],
    })
  }

  @Post('/did/key')
  public async createDidKey(
    @Body() didOptions: DidCreate,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const did = await this.agent.dids.create<KeyDidCreateOptions>({
        method: 'key',
        options: {
          keyType: KeyType.Ed25519,
        },
        secret: {
          privateKey: TypedArrayEncoder.fromString(didOptions.seed),
        },
      })
      await this.agent.dids.import({
        did: `${did.didState.did}`,
        overwrite: true,
        privateKeys: [
          {
            keyType: KeyType.Ed25519,
            privateKey: TypedArrayEncoder.fromString(didOptions.seed),
          },
        ],
      })
      return { did: `${did.didState.did}` }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/did/web')
  public async createDidWeb(
    @Body() didOptions: DidCreate,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const domain = didOptions.domain ? didOptions.domain : 'credebl.github.io'
      const did = `did:web:${domain}`
      const keyId = `${did}#key-1`

      const key = await this.agent.wallet.createKey({
        keyType: KeyType.Ed25519,
        privateKey: TypedArrayEncoder.fromString(didOptions.seed),
      })

      const didDocument = new DidDocumentBuilder(did)
        .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
        .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
        .addAuthentication(keyId)
        .build()

      await this.agent.dids.import({
        did,
        overwrite: true,
        didDocument,
      })
      return { did }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Get('/')
  public async getDids(@Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const createdDids = await this.agent.dids.getCreatedDids()
      return createdDids
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
