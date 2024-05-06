import type { AgentType } from '../../types/request'
import type { DidResolutionResultProps } from '../types'
import type { KeyDidCreateOptions } from '@aries-framework/core'
// eslint-disable-next-line import/order
import type { PolygonDidCreateOptions } from '@ayanworks/credo-polygon-w3c-module/build/dids'

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  KeyType,
  TypedArrayEncoder,
  DidDocumentBuilder,
  getEd25519VerificationKey2018,
  getBls12381G2Key2020,
} from '@aries-framework/core'
import axios from 'axios'
import { Request as Req } from 'express'
import { injectable } from 'tsyringe'

import { DidMethod, Network, Role } from '../../enums/enum'
import { BCOVRIN_REGISTER_URL, INDICIO_NYM_URL } from '../../utils/util'
import { Did, DidRecordExample } from '../examples'
import { DidCreate } from '../types'

import { Body, Controller, Example, Get, Path, Post, Res, Route, Tags, TsoaResponse, Security, Request } from 'tsoa'

@Tags('Dids')
@Route('/dids')
// @Security('apiKey')
@Security('jwt')
@injectable()
export class DidController extends Controller {
  /**
   * Resolves did and returns did resolution result
   * @param did Decentralized Identifier
   * @returns DidResolutionResult
   */
  @Example<DidResolutionResultProps>(DidRecordExample)
  @Get('/:did')
  public async getDidRecordByDid(@Request() request: Req, @Path('did') did: Did) {
    const resolveResult = await request.agent.dids.resolve(did)
    const importDid = await request.agent.dids.import({
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
  public async writeDid(
    @Request() request: Req,
    @Body() createDidOptions: DidCreate,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    let didRes

    try {
      if (!createDidOptions.method) {
        throw Error('Method is required')
      }

      let result
      switch (createDidOptions.method) {
        case DidMethod.Indy:
          result = await this.handleIndy(createDidOptions, request.agent)
          break

        case DidMethod.Key:
          result = await this.handleKey(createDidOptions, request.agent)
          break

        case DidMethod.Web:
          result = await this.handleWeb(createDidOptions, request.agent)
          break

        case DidMethod.Polygon:
          result = await this.handlePolygon(createDidOptions, request.agent)
          break

        default:
          return internalServerError(500, { message: `Invalid method: ${createDidOptions.method}` })
      }

      didRes = { ...result }

      return didRes
    } catch (error) {
      return internalServerError(500, { message: `Something went wrong: ${error}` })
    }
  }

  private async handleIndy(createDidOptions: DidCreate, agent: AgentType) {
    let result
    if (!createDidOptions.keyType) {
      throw Error('keyType is required')
    }

    if (!createDidOptions.network) {
      throw Error('For indy method network is required')
    }

    if (createDidOptions.keyType !== KeyType.Ed25519) {
      throw Error('Only ed25519 key type supported')
    }

    if (!Network.Bcovrin_Testnet && !Network.Indicio_Demonet && !Network.Indicio_Testnet) {
      throw Error(`Invalid network for 'indy' method: ${createDidOptions.network}`)
    }

    switch (createDidOptions?.network?.toLowerCase()) {
      case Network.Bcovrin_Testnet:
        result = await this.handleBcovrin(
          createDidOptions,
          `did:${createDidOptions.method}:${createDidOptions.network}`,
          agent
        )
        break

      case Network.Indicio_Demonet:
      case Network.Indicio_Testnet:
        result = await this.handleIndicio(
          createDidOptions,
          `did:${createDidOptions.method}:${createDidOptions.network}`,
          agent
        )
        break

      default:
        throw new Error(`Network does not exists`)
    }
    return result
  }

  private async handleBcovrin(createDidOptions: DidCreate, didMethod: string, agent: AgentType) {
    let didDocument
    if (!createDidOptions.seed) {
      throw Error('Seed is required')
    }
    if (createDidOptions?.role?.toLowerCase() === Role.Endorser) {
      if (createDidOptions.did) {
        await this.importDid(didMethod, createDidOptions.did, createDidOptions.seed, agent)
        const getDid = await agent.dids.getCreatedDids({
          method: createDidOptions.method,
          did: `did:${createDidOptions.method}:${createDidOptions.network}:${createDidOptions.did}`,
        })
        if (getDid.length > 0) {
          didDocument = getDid[0].didDocument
        }

        return {
          did: `${didMethod}:${createDidOptions.did}`,
          didDocument: didDocument,
        }
      } else {
        const res = await axios.post(BCOVRIN_REGISTER_URL, {
          role: 'ENDORSER',
          alias: 'Alias',
          seed: createDidOptions.seed,
        })
        const { did } = res?.data || {}
        await this.importDid(didMethod, did, createDidOptions.seed, agent)
        const didRecord = await agent.dids.getCreatedDids({
          method: DidMethod.Indy,
          did: `did:${DidMethod.Indy}:${Network.Bcovrin_Testnet}:${res.data.did}`,
        })

        if (didRecord.length > 0) {
          didDocument = didRecord[0].didDocument
        }

        return {
          did: `${didMethod}:${res.data.did}`,
          didDocument: didDocument,
        }
      }
    } else {
      if (!createDidOptions.endorserDid) {
        throw new Error('Please provide the endorser DID or role')
      }
      const didCreateTxResult = await this.createEndorserDid(createDidOptions.endorserDid, agent)
      return { did: didCreateTxResult.didState.did, didDocument: didCreateTxResult.didState.didDocument }
    }
  }

  private async handleIndicio(createDidOptions: DidCreate, didMethod: string, agent: AgentType) {
    let didDocument
    if (!createDidOptions.seed) {
      throw Error('Seed is required')
    }
    if (createDidOptions?.role?.toLowerCase() === Role.Endorser) {
      if (createDidOptions.did) {
        await this.importDid(didMethod, createDidOptions.did, createDidOptions.seed, agent)
        const didRecord = await agent.dids.getCreatedDids({
          method: createDidOptions.method,
          did: `did:${createDidOptions.method}:${createDidOptions.network}:${createDidOptions.did}`,
        })

        if (didRecord.length > 0) {
          didDocument = didRecord[0].didDocument
        }

        return {
          did: `${didMethod}:${createDidOptions.did}`,
          didDocument: didDocument,
        }
      } else {
        const key = await this.createIndicioKey(createDidOptions, agent)
        const res = await axios.post(INDICIO_NYM_URL, key)
        if (res.data.statusCode === 200) {
          await this.importDid(didMethod, key.did, createDidOptions.seed, agent)
          const didRecord = await agent.dids.getCreatedDids({
            method: DidMethod.Indy,
            did: `${didMethod}:${key.did}`,
          })

          if (didRecord.length > 0) {
            didDocument = didRecord[0].didDocument
          }

          return {
            did: `${didMethod}:${key.did}`,
            didDocument: didDocument,
          }
        }
      }
    } else {
      if (!createDidOptions.endorserDid) {
        throw new Error('Please provide the endorser DID or role')
      }
      const didCreateTxResult = await this.createEndorserDid(createDidOptions.endorserDid, agent)
      return didCreateTxResult
    }
  }

  private async createEndorserDid(endorserDid: string, agent: AgentType) {
    return agent.dids.create({
      method: 'indy',
      options: {
        endorserMode: 'external',
        endorserDid: endorserDid || '',
      },
    })
  }

  private async createIndicioKey(createDidOptions: DidCreate, agent: AgentType) {
    if (!createDidOptions.seed) {
      throw Error('Seed is required')
    }
    const key = await agent.wallet.createKey({
      privateKey: TypedArrayEncoder.fromString(createDidOptions.seed),
      keyType: KeyType.Ed25519,
    })

    const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58)
    const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16))

    let body
    if (createDidOptions.network === Network.Indicio_Testnet) {
      body = {
        network: 'testnet',
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      }
    } else if (createDidOptions.network === Network.Indicio_Demonet) {
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

  private async importDid(didMethod: string, did: string, seed: string, agent: AgentType) {
    await agent.dids.import({
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

  public async handleKey(didOptions: DidCreate, agent: AgentType) {
    let did
    let didResponse
    let didDocument

    if (!didOptions.seed) {
      throw Error('Seed is required')
    }
    if (!didOptions.keyType) {
      throw Error('keyType is required')
    }
    if (didOptions.keyType !== KeyType.Ed25519 && didOptions.keyType !== KeyType.Bls12381g2) {
      throw Error('Only ed25519 and bls12381g2 key type supported')
    }

    if (!didOptions.did) {
      await agent.wallet.createKey({
        keyType: didOptions.keyType,
        seed: TypedArrayEncoder.fromString(didOptions.seed),
      })

      didResponse = await agent.dids.create<KeyDidCreateOptions>({
        method: DidMethod.Key,
        options: {
          keyType: KeyType.Ed25519,
        },
        secret: {
          privateKey: TypedArrayEncoder.fromString(didOptions.seed),
        },
      })
      did = `${didResponse.didState.did}`
      didDocument = didResponse.didState.didDocument
    } else {
      did = didOptions.did
      const createdDid = await agent.dids.getCreatedDids({
        method: DidMethod.Key,
        did: didOptions.did,
      })
      didDocument = createdDid[0]?.didDocument
    }

    await agent.dids.import({
      did,
      overwrite: true,
      didDocument,
    })
    return { did: did, didDocument: didDocument }
  }

  public async handleWeb(didOptions: DidCreate, agent: AgentType) {
    let didDocument: any
    if (!didOptions.domain) {
      throw Error('domain is required')
    }

    if (!didOptions.seed) {
      throw Error('Seed is required')
    }

    if (!didOptions.keyType) {
      throw Error('keyType is required')
    }

    if (didOptions.keyType !== KeyType.Ed25519 && didOptions.keyType !== KeyType.Bls12381g2) {
      throw Error('Only ed25519 and bls12381g2 key type supported')
    }

    const domain = didOptions.domain
    const did = `did:${didOptions.method}:${domain}`
    const keyId = `${did}#key-1`

    const key = await agent.wallet.createKey({
      keyType: KeyType.Ed25519,
      privateKey: TypedArrayEncoder.fromString(didOptions.seed),
    })

    if (didOptions.keyType === KeyType.Ed25519) {
      didDocument = new DidDocumentBuilder(did)
        .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
        .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
        .addAuthentication(keyId)
        .build()
    }
    if (didOptions.keyType === KeyType.Bls12381g2) {
      didDocument = new DidDocumentBuilder(did)
        .addContext('https://w3id.org/security/bbs/v1')
        .addVerificationMethod(getBls12381G2Key2020({ key, id: keyId, controller: did }))
        .addAuthentication(keyId)
        .build()
    }

    await agent.dids.import({
      did,
      overwrite: true,
      didDocument,
    })
    return { did, didDocument }
  }

  public async handlePolygon(createDidOptions: DidCreate, agent: AgentType) {
    // need to discuss try catch logic
    const { endpoint, network, privatekey } = createDidOptions
    if (network !== 'mainnet' && network !== 'testnet') {
      throw Error('Invalid network type')
    }
    if (!privatekey || typeof privatekey !== 'string' || !privatekey.trim() || privatekey.length !== 64) {
      throw Error('Invalid private key or not supported')
    }

    return agent.dids.create<PolygonDidCreateOptions>({
      method: 'polygon',
      options: {
        network,
        endpoint,
      },
      secret: {
        privateKey: TypedArrayEncoder.fromHex(`${privatekey}`),
      },
    })
  }

  @Get('/')
  public async getDids(@Request() request: Req, @Res() internalServerError: TsoaResponse<500, { message: string }>) {
    try {
      const createdDids = await request.agent.dids.getCreatedDids()
      return createdDids
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
