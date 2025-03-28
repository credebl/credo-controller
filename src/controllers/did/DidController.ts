import type { DidResolutionResultProps } from '../types'
import type { PolygonDidCreateOptions } from '@ayanworks/credo-polygon-w3c-module/build/dids'
import type { KeyDidCreateOptions } from '@credo-ts/core'

import {
  KeyType,
  TypedArrayEncoder,
  DidDocumentBuilder,
  getEd25519VerificationKey2018,
  Agent,
  getBls12381G2Key2020,
} from '@credo-ts/core'
import axios from 'axios'
import { injectable } from 'tsyringe'

import { DidMethod, Network, Role } from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError } from '../../errors'
import { CreateDidResponse, Did, DidRecordExample } from '../examples'
import { DidCreate } from '../types'

import { Body, Controller, Example, Get, Path, Post, Route, Tags, Security } from 'tsoa'

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
    try {
      const resolveResult = await this.agent.dids.resolve(did)
      const importDid = await this.agent.dids.import({
        did,
        overwrite: true,
      })
      if (!resolveResult.didDocument) {
        throw new InternalServerError(`Error resolving DID docs for did: ${importDid}`)
      }

      return { ...resolveResult, didDocument: resolveResult.didDocument.toJSON() }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Did nym registration
   * @body DidCreateOptions
   * @returns DidResolutionResult
   */
  // @Example<DidResolutionResultProps>(DidRecordExample)

  @Example(CreateDidResponse)
  @Post('/write')
  public async writeDid(@Body() createDidOptions: DidCreate) {
    let didRes

    try {
      if (!createDidOptions.method) {
        throw new BadRequestError('Method is required')
      }

      let result
      switch (createDidOptions.method) {
        case DidMethod.Indy:
          result = await this.handleIndy(createDidOptions)
          break

        case DidMethod.Key:
          result = await this.handleKey(createDidOptions)
          break

        case DidMethod.Web:
          result = await this.handleWeb(createDidOptions)
          break

        case DidMethod.Polygon:
          result = await this.handlePolygon(createDidOptions)
          break

        default:
          throw new BadRequestError(`Invalid method: ${createDidOptions.method}`)
      }

      didRes = { ...result }

      return didRes
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  private async handleIndy(createDidOptions: DidCreate) {
    let result
    if (!createDidOptions.keyType) {
      throw new BadRequestError('keyType is required')
    }

    if (!createDidOptions.network) {
      throw new BadRequestError('For indy method network is required')
    }

    if (createDidOptions.keyType !== KeyType.Ed25519) {
      throw new BadRequestError('Only ed25519 key type supported')
    }

    if (!Network.Bcovrin_Testnet && !Network.Indicio_Demonet && !Network.Indicio_Testnet) {
      throw new BadRequestError(`Invalid network for 'indy' method: ${createDidOptions.network}`)
    }

    switch (createDidOptions?.network?.toLowerCase()) {
      case Network.Bcovrin_Testnet:
        result = await this.handleBcovrin(
          createDidOptions,
          `did:${createDidOptions.method}:${createDidOptions.network}`
        )
        break

      case Network.Indicio_Demonet:
      case Network.Indicio_Testnet:
        result = await this.handleIndicio(
          createDidOptions,
          `did:${createDidOptions.method}:${createDidOptions.network}`
        )
        break

      default:
        throw new BadRequestError(`Network does not exists`)
    }
    return result
  }

  private async handleBcovrin(createDidOptions: DidCreate, didMethod: string) {
    let didDocument
    if (!createDidOptions.seed) {
      throw new BadRequestError('Seed is required')
    }
    if (createDidOptions?.role?.toLowerCase() === Role.Endorser) {
      if (createDidOptions.did) {
        await this.importDid(didMethod, createDidOptions.did, createDidOptions.seed)
        const getDid = await this.agent.dids.getCreatedDids({
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
        const BCOVRIN_REGISTER_URL = process.env.BCOVRIN_REGISTER_URL as string
        const res = await axios.post(BCOVRIN_REGISTER_URL, {
          role: 'ENDORSER',
          alias: 'Alias',
          seed: createDidOptions.seed,
        })
        const { did } = res?.data || {}
        await this.importDid(didMethod, did, createDidOptions.seed)
        const didRecord = await this.agent.dids.getCreatedDids({
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
        throw new BadRequestError('Please provide the endorser DID or role')
      }
      const didCreateTxResult = await this.createEndorserDid(createDidOptions.endorserDid)
      return { did: didCreateTxResult.didState.did, didDocument: didCreateTxResult.didState.didDocument }
    }
  }

  private async handleIndicio(createDidOptions: DidCreate, didMethod: string) {
    let didDocument
    if (!createDidOptions.seed) {
      throw new BadRequestError('Seed is required')
    }
    if (createDidOptions?.role?.toLowerCase() === Role.Endorser) {
      if (createDidOptions.did) {
        await this.importDid(didMethod, createDidOptions.did, createDidOptions.seed)
        const didRecord = await this.agent.dids.getCreatedDids({
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
        const key = await this.createIndicioKey(createDidOptions)
        const INDICIO_NYM_URL = process.env.INDICIO_NYM_URL as string
        const res = await axios.post(INDICIO_NYM_URL, key)
        if (res.data.statusCode === 200) {
          await this.importDid(didMethod, key.did, createDidOptions.seed)
          const didRecord = await this.agent.dids.getCreatedDids({
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
        throw new BadRequestError('Please provide the endorser DID or role')
      }
      const didCreateTxResult = await this.createEndorserDid(createDidOptions.endorserDid)
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

  private async createIndicioKey(createDidOptions: DidCreate) {
    if (!createDidOptions.seed) {
      throw new BadRequestError('Seed is required')
    }
    const key = await this.agent.wallet.createKey({
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
      throw new BadRequestError('Please provide a valid did method')
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

  public async handleKey(didOptions: DidCreate) {
    let did
    let didResponse
    let didDocument

    if (!didOptions.seed) {
      throw new BadRequestError('Seed is required')
    }
    if (!didOptions.keyType) {
      throw new BadRequestError('keyType is required')
    }
    if (didOptions.keyType !== KeyType.Ed25519 && didOptions.keyType !== KeyType.Bls12381g2) {
      throw new BadRequestError('Only ed25519 and bls12381g2 key type supported')
    }

    if (!didOptions.did) {
      await this.agent.wallet.createKey({
        keyType: didOptions.keyType,
        seed: TypedArrayEncoder.fromString(didOptions.seed),
      })

      didResponse = await this.agent.dids.create<KeyDidCreateOptions>({
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
      const createdDid = await this.agent.dids.getCreatedDids({
        method: DidMethod.Key,
        did: didOptions.did,
      })
      didDocument = createdDid[0]?.didDocument
    }

    await this.agent.dids.import({
      did,
      overwrite: true,
      didDocument,
    })
    return { did: did, didDocument: didDocument }
  }

  public async handleWeb(didOptions: DidCreate) {
    let didDocument: any
    if (!didOptions.domain) {
      throw new BadRequestError('domain is required')
    }

    if (!didOptions.seed) {
      throw new BadRequestError('Seed is required')
    }

    if (!didOptions.keyType) {
      throw new BadRequestError('keyType is required')
    }

    if (didOptions.keyType !== KeyType.Ed25519 && didOptions.keyType !== KeyType.Bls12381g2) {
      throw new BadRequestError('Only ed25519 and bls12381g2 key type supported')
    }

    const domain = didOptions.domain
    const did = `did:${didOptions.method}:${domain}`
    const keyId = `${did}#key-1`

    const key = await this.agent.wallet.createKey({
      keyType: KeyType.Ed25519,
      privateKey: TypedArrayEncoder.fromString(didOptions.seed),
    })

    if (didOptions.keyType === KeyType.Ed25519) {
      didDocument = new DidDocumentBuilder(did)
        .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
        .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
        .addAuthentication(keyId)
        .addAssertionMethod(keyId)
        .build()
    }
    if (didOptions.keyType === KeyType.Bls12381g2) {
      didDocument = new DidDocumentBuilder(did)
        .addContext('https://w3id.org/security/bbs/v1')
        .addVerificationMethod(getBls12381G2Key2020({ key, id: keyId, controller: did }))
        .addAuthentication(keyId)
        .addAssertionMethod(keyId)
        .build()
    }

    await this.agent.dids.import({
      did,
      overwrite: true,
      didDocument,
    })
    return { did, didDocument }
  }

  public async handlePolygon(createDidOptions: DidCreate) {
    // need to discuss try catch logic
    const { endpoint, network, privatekey } = createDidOptions

    if (!network) {
      throw new BadRequestError('Network is required for Polygon method')
    }

    const networkName = network?.split(':')[1]

    if (networkName !== 'mainnet' && networkName !== 'testnet') {
      throw new BadRequestError('Invalid network type')
    }
    if (!privatekey || typeof privatekey !== 'string' || !privatekey.trim() || privatekey.length !== 64) {
      throw new BadRequestError('Invalid private key or not supported')
    }

    const createDidResponse = await this.agent.dids.create<PolygonDidCreateOptions>({
      method: DidMethod.Polygon,
      options: {
        network: networkName,
        endpoint,
      },
      secret: {
        privateKey: TypedArrayEncoder.fromHex(`${privatekey}`),
      },
    })
    const didResponse = {
      did: createDidResponse?.didState?.did,
      didDocument: createDidResponse?.didState?.didDocument,
    }
    return didResponse
  }

  @Get('/')
  public async getDids() {
    try {
      const createdDids = await this.agent.dids.getCreatedDids()
      return createdDids
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
