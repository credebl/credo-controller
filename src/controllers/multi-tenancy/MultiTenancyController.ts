import type { RestAgentModules, RestMultiTenantAgentModules } from '../../cliAgent'
import type { Version } from '../examples'
import type { RecipientKeyOption, SchemaMetadata } from '../types'
import type { PolygonDidCreateOptions } from '@ayanworks/credo-polygon-w3c-module/build/dids'
import type {
  AcceptProofRequestOptions,
  ConnectionRecordProps,
  CreateOutOfBandInvitationConfig,
  CredentialProtocolVersionType,
  KeyDidCreateOptions,
  OutOfBandRecord,
  PeerDidNumAlgo2CreateOptions,
  ProofExchangeRecordProps,
  ProofsProtocolVersionType,
  Routing,
} from '@credo-ts/core'
import type { IndyVdrDidCreateOptions, IndyVdrDidCreateResult } from '@credo-ts/indy-vdr'
import type { QuestionAnswerRecord, ValidResponse } from '@credo-ts/question-answer'
import type { TenantRecord } from '@credo-ts/tenants'
import type { TenantAgent } from '@credo-ts/tenants/build/TenantAgent'

import {
  getUnqualifiedSchemaId,
  getUnqualifiedCredentialDefinitionId,
  parseIndyCredentialDefinitionId,
  parseIndySchemaId,
} from '@credo-ts/anoncreds'
import {
  AcceptCredentialOfferOptions,
  Agent,
  ConnectionRepository,
  CredentialRepository,
  CredentialState,
  DidDocumentBuilder,
  DidExchangeState,
  JsonTransformer,
  Key,
  KeyType,
  OutOfBandInvitation,
  RecordNotFoundError,
  TypedArrayEncoder,
  getBls12381G2Key2020,
  getEd25519VerificationKey2018,
  injectable,
  createPeerDidDocumentFromServices,
  PeerDidNumAlgo,
} from '@credo-ts/core'
import { QuestionAnswerRole, QuestionAnswerState } from '@credo-ts/question-answer'
import axios from 'axios'
import * as fs from 'fs'

import { CredentialEnum, DidMethod, EndorserMode, Network, NetworkTypes, Role, SchemaError } from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { ENDORSER_DID_NOT_PRESENT } from '../../errorMessages'
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  PaymentRequiredError,
  UnprocessableEntityError,
} from '../../errors'
import { BCOVRIN_REGISTER_URL, INDICIO_NYM_URL } from '../../utils/util'
import { SchemaId, CredentialDefinitionId, RecordId, ProofRecordExample, ConnectionRecordExample } from '../examples'
import {
  RequestProofOptions,
  CreateOfferOptions,
  CreateTenantOptions,
  DidCreate,
  DidNymTransaction,
  EndorserTransaction,
  ReceiveInvitationByUrlProps,
  ReceiveInvitationProps,
  WriteTransaction,
  CreateProofRequestOobOptions,
  CreateOfferOobOptions,
  CreateSchemaInput,
} from '../types'

import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Path,
  Example,
  Security,
  Response,
} from 'tsoa'

@Tags('MultiTenancy')
@Route('/multi-tenancy')
@injectable()
export class MultiTenancyController extends Controller {
  private readonly agent: Agent<RestMultiTenantAgentModules>

  public constructor(agent: Agent<RestMultiTenantAgentModules>) {
    super()
    this.agent = agent
  }

  //create wallet
  @Security('apiKey')
  @Post('/create-tenant')
  public async createTenant(@Body() createTenantOptions: CreateTenantOptions) {
    const { config } = createTenantOptions
    try {
      const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config })
      return tenantRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/create-did/:tenantId')
  public async createDid(@Body() createDidOptions: DidCreate, @Path('tenantId') tenantId: string) {
    let didRes
    try {
      if (!createDidOptions.method) {
        throw Error('Method is required')
      }

      let result
      switch (createDidOptions.method) {
        case DidMethod.Indy:
          result = await this.handleIndy(createDidOptions, tenantId)
          break

        case DidMethod.Key:
          result = await this.handleKey(createDidOptions, tenantId)
          break

        case DidMethod.Web:
          result = await this.handleWeb(createDidOptions, tenantId)
          break

        case DidMethod.Polygon:
          result = await this.handlePolygon(createDidOptions, tenantId)
          break

        case DidMethod.Peer:
          result = await this.handleDidPeer(createDidOptions, tenantId)
          break

        default:
          throw new InternalServerError(`Invalid method: ${createDidOptions.method}`)
      }

      didRes = { ...result }

      return didRes
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  private async handleIndy(createDidOptions: DidCreate, tenantId: string) {
    const { keyType, seed, network, method } = createDidOptions

    let result
    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      if (!keyType) {
        throw Error('keyType is required')
      }

      if (!seed) {
        throw Error('Seed is required')
      }

      if (!network) {
        throw Error('For indy method network is required')
      }

      if (keyType !== KeyType.Ed25519) {
        throw Error('Only ed25519 key type supported')
      }

      if (!Network.Bcovrin_Testnet && !Network.Indicio_Demonet && !Network.Indicio_Testnet) {
        throw Error(`Invalid network for 'indy' method: ${network}`)
      }
      switch (network?.toLowerCase()) {
        case Network.Bcovrin_Testnet:
          result = await this.handleBcovrin(createDidOptions, tenantAgent, `did:${method}:${network}`)
          break

        case Network.Indicio_Demonet:
        case Network.Indicio_Testnet:
          result = await this.handleIndicio(createDidOptions, tenantAgent, `did:${method}:${network}`)
          break

        default:
          throw new BadRequestError(`Invalid network for 'indy' method: ${network}`)
      }
    })
    return result
  }

  private async handleBcovrin(
    createDidOptions: DidCreate,
    tenantAgent: TenantAgent<RestAgentModules>,
    didMethod: string
  ) {
    const { seed, did, network, method, role, endorserDid } = createDidOptions
    let didDocument
    if (!seed) {
      throw Error('Seed is required')
    }
    if (did) {
      await this.importDid(didMethod, did, seed, tenantAgent)
      const getDid = await tenantAgent.dids.getCreatedDids({
        method: method,
        did: `did:${method}:${network}:${did}`,
      })
      if (getDid.length > 0) {
        didDocument = getDid[0].didDocument
      }
      return {
        did: `${didMethod}:${did}`,
        didDocument: didDocument,
      }
    } else {
      if (role?.toLowerCase() === Role.Endorser) {
        await tenantAgent.wallet.createKey({
          privateKey: TypedArrayEncoder.fromString(seed),
          keyType: KeyType.Ed25519,
        })

        const body = {
          role: 'ENDORSER',
          alias: 'Alias',
          seed: seed,
        }

        const res = await axios.post(BCOVRIN_REGISTER_URL, body)
        if (res) {
          const { did } = res?.data || {}
          await this.importDid(didMethod, did, seed, tenantAgent)
          const didRecord = await tenantAgent.dids.getCreatedDids({
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
        if (!endorserDid) {
          throw Error('endorserDid or role is required')
        }

        const didCreateTxResult = (await this.agent.dids.create<IndyVdrDidCreateOptions>({
          method: DidMethod.Indy,
          options: {
            endorserMode: 'external',
            endorserDid: endorserDid,
          },
        })) as IndyVdrDidCreateResult
        return { did: didCreateTxResult.didState.did, didDocument: didCreateTxResult.didState.didDocument }
      }
    }
  }

  private async handleIndicio(
    createDidOptions: DidCreate,
    tenantAgent: TenantAgent<RestAgentModules>,
    didMethod: string
  ) {
    const { seed, did, method, network, role } = createDidOptions
    let didDocument
    if (!seed) {
      throw Error('Seed is required')
    }

    if (did) {
      await this.importDid(didMethod, did, seed, tenantAgent)
      const getDid = await tenantAgent.dids.getCreatedDids({
        method: method,
        did: `did:${method}:${network}:${did}`,
      })
      if (getDid.length > 0) {
        didDocument = getDid[0].didDocument
      }

      return {
        did: `${didMethod}:${did}`,
        didDocument: didDocument,
      }
    } else {
      if (role?.toLowerCase() === Role.Endorser) {
        return await this.handleEndorserCreation(createDidOptions, tenantAgent, didMethod)
      } else {
        return await this.handleIndyDidCreation(createDidOptions, tenantAgent)
      }
    }
  }

  private async handleEndorserCreation(
    createDidOptions: DidCreate,
    tenantAgent: TenantAgent<RestAgentModules>,
    didMethod: string
  ) {
    const { seed, network } = createDidOptions
    let didDocument
    if (!seed) {
      throw Error('Seed is required')
    }
    const key = await tenantAgent.wallet.createKey({
      privateKey: TypedArrayEncoder.fromString(seed),
      keyType: KeyType.Ed25519,
    })
    const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58)

    const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16))

    let body
    if (network === Network.Indicio_Testnet) {
      body = {
        network: NetworkTypes.Testnet,
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      }
    } else if (network === Network.Indicio_Demonet) {
      body = {
        network: NetworkTypes.Demonet,
        did,
        verkey: TypedArrayEncoder.toBase58(buffer),
      }
    }
    const res = await axios.post(INDICIO_NYM_URL, body)
    if (res.data.statusCode === 200) {
      await this.importDid(didMethod, did, seed, tenantAgent)
      const didRecord = await tenantAgent.dids.getCreatedDids({
        method: DidMethod.Indy,
        did: `${didMethod}:${body?.did}`,
      })
      if (didRecord.length > 0) {
        didDocument = didRecord[0].didDocument
      }

      return {
        did: `${didMethod}:${body?.did}`,
        didDocument: didDocument,
      }
    }
  }

  private async handleIndyDidCreation(createDidOptions: DidCreate, tenantAgent: TenantAgent<RestAgentModules>) {
    if (!createDidOptions.endorserDid) {
      throw Error('endorserDid or role is required')
    }

    const didCreateTxResult = await tenantAgent.dids.create({
      method: DidMethod.Indy,
      options: {
        endorserMode: 'external',
        endorserDid: createDidOptions.endorserDid ? createDidOptions.endorserDid : '',
      },
    })
    return { didTx: didCreateTxResult.didState.did }
  }

  private async handleKey(createDidOptions: DidCreate, tenantId: string) {
    const { seed, keyType } = createDidOptions
    let didResponse
    let did: string
    let didDocument: any

    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      if (!seed) {
        throw Error('Seed is required')
      }
      if (!keyType) {
        throw Error('keyType is required')
      }

      if (keyType !== KeyType.Ed25519 && keyType !== KeyType.Bls12381g2) {
        throw Error('Only ed25519 and bls12381g2 key type supported')
      }

      if (!createDidOptions.did) {
        await tenantAgent.wallet.createKey({
          keyType: createDidOptions.keyType,
          seed: TypedArrayEncoder.fromString(seed),
        })
        const didKeyResponse = await tenantAgent.dids.create<KeyDidCreateOptions>({
          method: DidMethod.Key,
          options: {
            keyType: KeyType.Ed25519,
          },
          secret: {
            privateKey: TypedArrayEncoder.fromString(seed),
          },
        })
        did = `${didKeyResponse.didState.did}`
        didDocument = didKeyResponse.didState.didDocument
      } else {
        did = createDidOptions.did
        const createdDid = await tenantAgent.dids.getCreatedDids({
          did: createDidOptions.did,
          method: DidMethod.Key,
        })
        didDocument = createdDid[0]?.didDocument
      }

      await tenantAgent.dids.import({
        did,
        overwrite: true,
        didDocument,
      })

      didResponse = {
        did,
        didDocument,
      }
    })
    return didResponse
  }

  private async handleDidPeer(createDidOptions: DidCreate, tenantId: string) {
    let didResponse
    let did: any

    if (!createDidOptions.keyType) {
      throw Error('keyType is required')
    }

    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      const didRouting = await tenantAgent.mediationRecipient.getRouting({})
      const didDocument = createPeerDidDocumentFromServices([
        {
          id: 'didcomm',
          recipientKeys: [didRouting.recipientKey],
          routingKeys: didRouting.routingKeys,
          serviceEndpoint: didRouting.endpoints[0],
        },
      ])
      const didPeerResponse = await tenantAgent.dids.create<PeerDidNumAlgo2CreateOptions>({
        didDocument,
        method: DidMethod.Peer,
        options: {
          numAlgo: PeerDidNumAlgo.MultipleInceptionKeyWithoutDoc,
        },
      })

      did = didPeerResponse.didState.did
      didResponse = {
        did,
      }
    })
    return didResponse
  }

  private async handleWeb(createDidOptions: DidCreate, tenantId: string) {
    const { domain, keyType, seed, method } = createDidOptions
    let did
    let didDocument: any

    if (!domain) {
      throw Error('For web method domain is required')
    }

    if (!keyType) {
      throw Error('keyType is required')
    }

    if (keyType !== KeyType.Ed25519 && keyType !== KeyType.Bls12381g2) {
      throw Error('Only ed25519 and bls12381g2 key type supported')
    }

    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      if (!seed) {
        throw Error('Seed is required')
      }

      did = `did:${method}:${domain}`
      const keyId = `${did}#key-1`
      const key = await tenantAgent.wallet.createKey({
        keyType: keyType,
        seed: TypedArrayEncoder.fromString(seed),
      })
      if (keyType === KeyType.Ed25519) {
        didDocument = new DidDocumentBuilder(did)
          .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
          .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
          .addAuthentication(keyId)
          .build()
      }
      if (keyType === KeyType.Bls12381g2) {
        didDocument = new DidDocumentBuilder(did)
          .addContext('https://w3id.org/security/bbs/v1')
          .addVerificationMethod(getBls12381G2Key2020({ key, id: keyId, controller: did }))
          .addAuthentication(keyId)
          .build()
      }

      await tenantAgent.dids.import({
        did,
        overwrite: true,
        didDocument,
      })
    })
    return { did, didDocument }
  }

  public async handlePolygon(createDidOptions: DidCreate, tenantId: string) {
    let createDidResponse
    let didResponse
    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      // need to discuss try catch logic

      const networkDetails = createDidOptions.network
      const networkName = networkDetails?.split(':')[1]

      const { endpoint, privatekey } = createDidOptions
      if (networkName !== 'mainnet' && networkName !== 'testnet') {
        throw Error('Invalid network type')
      }
      if (!privatekey || typeof privatekey !== 'string' || !privatekey.trim() || privatekey.length !== 64) {
        throw Error('Invalid private key or not supported')
      }

      createDidResponse = await tenantAgent.dids.create<PolygonDidCreateOptions>({
        method: DidMethod.Polygon,
        options: {
          network: networkName,
          endpoint,
        },
        secret: {
          privateKey: TypedArrayEncoder.fromHex(`${privatekey}`),
        },
      })
      didResponse = {
        did: createDidResponse?.didState?.did,
        didDoc: createDidResponse?.didState?.didDocument,
      }
    })
    return didResponse
  }

  private async importDid(didMethod: string, did: string, seed: string, tenantAgent: TenantAgent<RestAgentModules>) {
    await tenantAgent.dids.import({
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

  @Security('apiKey')
  @Get('/dids/:tenantId')
  public async getDids(@Path('tenantId') tenantId: string) {
    try {
      let getDids
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        getDids = await tenantAgent.dids.getCreatedDids()
      })
      return getDids
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/transactions/set-endorser-role/:tenantId')
  public async didNymTransaction(@Path('tenantId') tenantId: string, @Body() didNymTransaction: DidNymTransaction) {
    let didCreateSubmitResult
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        didCreateSubmitResult = await tenantAgent.dids.create({
          did: didNymTransaction.did,
          options: {
            endorserMode: 'external',
            endorsedTransaction: {
              nymRequest: didNymTransaction.nymRequest,
            },
          },
        })
        await tenantAgent.dids.import({
          did: didNymTransaction.did,
          overwrite: true,
        })
      })

      return didCreateSubmitResult
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/transactions/endorse/:tenantId')
  public async endorserTransaction(
    @Path('tenantId') tenantId: string,
    @Body() endorserTransaction: EndorserTransaction
  ) {
    let signedTransaction
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        signedTransaction = await tenantAgent.modules.indyVdr.endorseTransaction(
          endorserTransaction.transaction,
          endorserTransaction.endorserDid
        )
      })

      return { signedTransaction }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Example<ConnectionRecordProps>(ConnectionRecordExample)
  @Security('apiKey')
  @Get('/connections/:connectionId/:tenantId')
  public async getConnectionById(@Path('tenantId') tenantId: string, @Path('connectionId') connectionId: RecordId) {
    try {
      let connectionRecord
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const connection = await tenantAgent.connections.findById(connectionId)

        if (!connection) throw new NotFoundError(`connection with connection id "${connectionId}" not found.`)
        connectionRecord = connection.toJSON()
      })

      return connectionRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/create-invitation/:tenantId')
  public async createInvitation(
    @Path('tenantId') tenantId: string,
    @Body() config?: Omit<CreateOutOfBandInvitationConfig, 'routing'> & RecipientKeyOption // Remove routing property from type
  ) {
    let outOfBandRecord: OutOfBandRecord | undefined
    let invitationDid: string | undefined
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (config?.invitationDid) {
          invitationDid = config?.invitationDid
        } else {
          const didRouting = await tenantAgent.mediationRecipient.getRouting({})
          const didDocument = createPeerDidDocumentFromServices([
            {
              id: 'didcomm',
              recipientKeys: [didRouting.recipientKey],
              routingKeys: didRouting.routingKeys,
              serviceEndpoint: didRouting.endpoints[0],
            },
          ])
          const did = await tenantAgent.dids.create<PeerDidNumAlgo2CreateOptions>({
            didDocument,
            method: 'peer',
            options: {
              numAlgo: PeerDidNumAlgo.MultipleInceptionKeyWithoutDoc,
            },
          })
          invitationDid = did.didState.did

          if (!invitationDid) {
            throw new InternalServerError('Error in creating invitationDid')
          }
        }

        outOfBandRecord = await tenantAgent.oob.createInvitation({ ...config, invitationDid })
      })

      return {
        invitationUrl: outOfBandRecord?.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord?.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord?.toJSON(),
        invitationDid: config?.invitationDid ? '' : invitationDid,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/create-legacy-invitation/:tenantId')
  public async createLegacyInvitation(
    @Path('tenantId') tenantId: string,
    @Body()
    config?: Omit<CreateOutOfBandInvitationConfig, 'routing' | 'appendedAttachments' | 'messages'> & RecipientKeyOption // props removed because of issues with serialization
  ) {
    let getInvitation
    try {
      let routing: Routing
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (config?.recipientKey) {
          routing = {
            endpoints: tenantAgent.config.endpoints,
            routingKeys: [],
            recipientKey: Key.fromPublicKeyBase58(config.recipientKey, KeyType.Ed25519),
            mediatorId: undefined,
          }
        } else {
          routing = await tenantAgent.mediationRecipient.getRouting({})
        }
        const { outOfBandRecord, invitation } = await tenantAgent.oob.createLegacyInvitation({ ...config, routing })
        getInvitation = {
          invitationUrl: invitation.toUrl({
            domain: this.agent.config.endpoints[0],
            useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
          }),
          invitation: invitation.toJSON({
            useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
          }),
          outOfBandRecord: outOfBandRecord.toJSON(),
          ...(config?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 }),
        }
      })

      return getInvitation
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/receive-invitation/:tenantId')
  public async receiveInvitation(
    @Body() invitationRequest: ReceiveInvitationProps,
    @Path('tenantId') tenantId: string
  ) {
    let receiveInvitationRes
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const { invitation, ...config } = invitationRequest
        const invite = new OutOfBandInvitation({ ...invitation, handshakeProtocols: invitation.handshake_protocols })
        const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitation(invite, config)
        receiveInvitationRes = {
          outOfBandRecord: outOfBandRecord.toJSON(),
          connectionRecord: connectionRecord?.toJSON(),
        }
      })

      return receiveInvitationRes
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/receive-invitation-url/:tenantId')
  public async receiveInvitationFromUrl(
    @Body() invitationRequest: ReceiveInvitationByUrlProps,
    @Path('tenantId') tenantId: string
  ) {
    let receiveInvitationUrl
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const { invitationUrl, ...config } = invitationRequest
        const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitationFromUrl(
          invitationUrl,
          config
        )
        receiveInvitationUrl = {
          outOfBandRecord: outOfBandRecord.toJSON(),
          connectionRecord: connectionRecord?.toJSON(),
        }
      })
      return receiveInvitationUrl
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/oob/:invitationId/:tenantId')
  public async getAllOutOfBandRecords(@Path('tenantId') tenantId: string, @Path('invitationId') invitationId?: string) {
    let outOfBandRecordsRes
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        let outOfBandRecords
        outOfBandRecords = await tenantAgent.oob.getAll()

        if (invitationId)
          outOfBandRecords = outOfBandRecords.filter((o: any) => o.outOfBandInvitation.id === invitationId)
        outOfBandRecordsRes = outOfBandRecords.map((c: any) => c.toJSON())
      })

      return outOfBandRecordsRes
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/connections/:tenantId')
  public async getAllConnections(
    @Path('tenantId') tenantId: string,
    @Query('outOfBandId') outOfBandId?: string,
    @Query('alias') alias?: string,
    @Query('state') state?: DidExchangeState,
    @Query('myDid') myDid?: string,
    @Query('theirDid') theirDid?: string,
    @Query('theirLabel') theirLabel?: string
  ) {
    let connectionRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (outOfBandId) {
          connectionRecord = await tenantAgent.connections.findAllByOutOfBandId(outOfBandId)
        } else {
          const connectionRepository = tenantAgent.dependencyManager.resolve(ConnectionRepository)
          const connections = await connectionRepository.findByQuery(tenantAgent.context, {
            alias,
            myDid,
            theirDid,
            theirLabel,
            state,
          })
          connectionRecord = connections.map((c: any) => c.toJSON())
        }
      })
      return connectionRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Get('/url/:tenantId/:invitationId')
  public async getInvitation(@Path('invitationId') invitationId: string, @Path('tenantId') tenantId: string) {
    try {
      let invitationJson
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const outOfBandRecord = await tenantAgent.oob.findByCreatedInvitationId(invitationId)

        if (!outOfBandRecord || outOfBandRecord.state !== 'await-response')
          throw new NotFoundError(`connection with invitationId "${invitationId}" not found.`)

        invitationJson = outOfBandRecord.outOfBandInvitation.toJSON({ useDidSovPrefixWhereAllowed: true })
      })
      return invitationJson
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/schema/:tenantId')
  public async createSchema(
    @Body()
    schema: CreateSchemaInput,
    @Path('tenantId') tenantId: string
  ) {
    try {
      let createSchemaTxResult: any
      const { issuerId, name, version, attributes, endorserDid, endorse } = schema

      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const schemaPayload = {
          issuerId,
          name,
          version,
          attrNames: attributes,
        }

        const options = {
          endorserMode: '',
          endorserDid: '',
        }

        if (!endorse) {
          options.endorserMode = EndorserMode.Internal
          options.endorserDid = issuerId
        } else {
          if (!endorserDid) {
            throw new BadRequestError(ENDORSER_DID_NOT_PRESENT)
          }
          options.endorserMode = EndorserMode.External
          options.endorserDid = endorserDid
        }

        createSchemaTxResult = await tenantAgent.modules.anoncreds.registerSchema({
          schema: schemaPayload,
          options: options,
        })
      })
      if (createSchemaTxResult?.schemaState.state === CredentialEnum.Failed) {
        throw new InternalServerError(`Schema creation failed. Reason: ${createSchemaTxResult?.schemaState.reason}`)
      }

      if (createSchemaTxResult?.schemaState.state === CredentialEnum.Wait) {
        this.setStatus(202)
        return createSchemaTxResult
      }

      if (createSchemaTxResult?.schemaState.state === CredentialEnum.Action) {
        return createSchemaTxResult
      }

      if (createSchemaTxResult.schemaState.state === CredentialEnum.Finished) {
        // TODO: Return uniform response for both Internally and Externally endorsed Schemas
        if (!endorse) {
          const indySchemaId = parseIndySchemaId(createSchemaTxResult.schemaState.schemaId as string)
          const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
            indySchemaId.namespaceIdentifier,
            indySchemaId.schemaName,
            indySchemaId.schemaVersion
          )
          createSchemaTxResult.schemaState.schemaId = getSchemaUnqualifiedId
          return createSchemaTxResult.schemaState
        }
        return createSchemaTxResult
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/polygon-wc3/schema/:tenantId')
  public async createPolygonW3CSchema(
    @Body()
    createSchemaRequest: {
      did: string
      schemaName: string
      schema: { [key: string]: any }
    },
    @Path('tenantId') tenantId: string
  ): Promise<SchemaMetadata> {
    try {
      const { did, schemaName, schema } = createSchemaRequest
      if (!did || !schemaName || !schema) {
        throw new BadRequestError('One or more parameters are empty or undefined.')
      }

      const schemaResponse = await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        return await tenantAgent.modules.polygon.createSchema({
          did,
          schemaName,
          schema,
        })
      })
      if (schemaResponse.schemaState?.state === CredentialEnum.Failed) {
        const reason = schemaResponse.schemaState?.reason?.toLowerCase()
        if (reason && reason.includes('insufficient') && reason.includes('funds')) {
          throw new PaymentRequiredError(
            'Insufficient funds to the address, Please add funds to perform this operation'
          )
        } else {
          throw new InternalServerError(schemaResponse.schemaState?.reason)
        }
      }
      const configFileData = fs.readFileSync('config.json', 'utf-8')
      const config = JSON.parse(configFileData)
      if (!config.schemaFileServerURL) {
        throw new UnprocessableEntityError('Please provide valid schema file server URL')
      }

      if (!schemaResponse?.schemaId) {
        throw new InternalServerError('Error in getting schema response')
      }
      const schemaPayload: SchemaMetadata = {
        schemaUrl: config.schemaFileServerURL + schemaResponse?.schemaId,
        did: schemaResponse?.did,
        schemaId: schemaResponse?.schemaId,
        schemaTxnHash: schemaResponse?.resourceTxnHash,
      }

      return schemaPayload
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('polygon-wc3/schema/:did/:schemaId/:tenantId')
  public async getPolygonW3CSchemaById(
    @Path('tenantId') tenantId: string,
    @Path('did') did: string,
    @Path('schemaId') schemaId: string
  ) {
    try {
      let schemaDetails

      if (!tenantId || !did || !schemaId) {
        throw new BadRequestError('Missing or invalid parameters.')
      }
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        schemaDetails = await tenantAgent.modules.polygon.getSchemaById(did, schemaId)
      })
      return schemaDetails
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/transactions/write/:tenantId')
  public async writeSchemaAndCredDefOnLedger(
    @Path('tenantId') tenantId: string,
    @Body()
    writeTransaction: WriteTransaction
  ) {
    try {
      if (writeTransaction.schema) {
        const writeSchema = await this.submitSchemaOnLedger(
          writeTransaction.schema,
          writeTransaction.endorsedTransaction,
          tenantId
        )
        return writeSchema
      } else if (writeTransaction.credentialDefinition) {
        const writeCredDef = await this.submitCredDefOnLedger(
          writeTransaction.credentialDefinition,
          writeTransaction.endorsedTransaction,
          tenantId
        )
        return writeCredDef
      } else {
        throw new Error('Please provide valid schema or credential-def!')
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  public async submitSchemaOnLedger(
    schema: {
      issuerId: string
      name: string
      version: Version
      attributes: string[]
    },
    endorsedTransaction: string,
    tenantId: string
  ) {
    let schemaRecord
    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      const { issuerId, name, version, attributes } = schema
      const { schemaState } = await tenantAgent.modules.anoncreds.registerSchema({
        options: {
          endorserMode: 'external',
          endorsedTransaction,
        },
        schema: {
          attrNames: attributes,
          issuerId: issuerId,
          name: name,
          version: version,
        },
      })

      if (!schemaState.schemaId) {
        throw Error('SchemaId not found')
      }

      const indySchemaId = parseIndySchemaId(schemaState.schemaId)
      const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(
        indySchemaId.namespaceIdentifier,
        indySchemaId.schemaName,
        indySchemaId.schemaVersion
      )
      if (schemaState.state === CredentialEnum.Finished || schemaState.state === CredentialEnum.Action) {
        schemaState.schemaId = getSchemaUnqualifiedId
      }
      schemaRecord = schemaState
    })
    return schemaRecord
  }

  public async submitCredDefOnLedger(
    credentialDefinition: {
      schemaId: string
      issuerId: string
      tag: string
      value: unknown
      type: string
    },
    endorsedTransaction: string,
    tenantId: string
  ) {
    let credentialDefinitionRecord
    await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      const { credentialDefinitionState } = await tenantAgent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition,
        options: {
          endorserMode: 'external',
          endorsedTransaction: endorsedTransaction,
          // TODO: Update this later
          supportRevocation: false,
        },
      })

      if (!credentialDefinitionState.credentialDefinitionId) {
        throw Error('Credential Definition Id not found')
      }

      const indyCredDefId = parseIndyCredentialDefinitionId(credentialDefinitionState.credentialDefinitionId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(
        indyCredDefId.namespaceIdentifier,
        indyCredDefId.schemaSeqNo,
        indyCredDefId.tag
      )
      if (
        credentialDefinitionState.state === CredentialEnum.Finished ||
        credentialDefinitionState.state === CredentialEnum.Action
      ) {
        credentialDefinitionState.credentialDefinitionId = getCredentialDefinitionId
      }

      credentialDefinitionRecord = credentialDefinitionState
    })
    return credentialDefinitionRecord
  }

  @Security('apiKey')
  @Get('/schema/:schemaId/:tenantId')
  public async getSchemaById(@Path('schemaId') schemaId: SchemaId, @Path('tenantId') tenantId: string) {
    let schemBySchemaId
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        schemBySchemaId = await tenantAgent.modules.anoncreds.getSchema(schemaId)

        if (
          schemBySchemaId?.resolutionMetadata?.error === SchemaError.NotFound ||
          schemBySchemaId?.resolutionMetadata?.error === SchemaError.UnSupportedAnonCredsMethod
        ) {
          throw new NotFoundError(
            schemBySchemaId?.resolutionMetadata?.message || `schema details with schema id "${schemaId}" not found.`
          )
        }
      })

      return schemBySchemaId
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/credential-definition/:tenantId')
  @Response(200, 'Action required')
  @Response(202, 'Wait for action to complete')
  public async createCredentialDefinition(
    @Body()
    credentialDefinitionRequest: {
      issuerId: string
      schemaId: string
      tag: string
      endorse?: boolean
      endorserDid?: string
    },
    @Path('tenantId') tenantId: string
  ) {
    try {
      let registerCredentialDefinitionResult: any
      const { issuerId, schemaId, tag, endorse, endorserDid } = credentialDefinitionRequest
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        credentialDefinitionRequest.endorse = credentialDefinitionRequest.endorse
          ? credentialDefinitionRequest.endorse
          : false

        const credDef = {
          issuerId,
          schemaId,
          tag,
          // TODO: Need to check this
          // type: 'CL',
        }
        const credentialDefinitionPayload = {
          credentialDefinition: credDef,
          options: {
            endorserMode: '',
            endorserDid: '',
            // TODO: update this later
            supportRevocation: false,
          },
        }

        if (!endorse) {
          credentialDefinitionPayload.options.endorserMode = EndorserMode.Internal
          credentialDefinitionPayload.options.endorserDid = issuerId
        } else {
          if (!endorserDid) {
            throw new BadRequestError(ENDORSER_DID_NOT_PRESENT)
          }
          credentialDefinitionPayload.options.endorserMode = EndorserMode.External
          credentialDefinitionPayload.options.endorserDid = endorserDid
        }

        registerCredentialDefinitionResult = await tenantAgent.modules.anoncreds.registerCredentialDefinition(
          credentialDefinitionPayload
        )
      })

      if (registerCredentialDefinitionResult?.credentialDefinitionState.state === CredentialEnum.Failed) {
        throw new InternalServerError('Falied to register credef on ledger')
      }

      if (registerCredentialDefinitionResult?.credentialDefinitionState.state === CredentialEnum.Wait) {
        // The request has been accepted for processing, but the processing has not been completed.
        this.setStatus(202)
        return registerCredentialDefinitionResult
      }

      if (registerCredentialDefinitionResult?.credentialDefinitionState.state === CredentialEnum.Action) {
        return registerCredentialDefinitionResult
      }
      // TODO: Return uniform response for both Internally and Externally endorsed Schemas
      if (!endorse) {
        const indyCredDefId = parseIndyCredentialDefinitionId(
          registerCredentialDefinitionResult?.credentialDefinitionState.credentialDefinitionId as string
        )

        const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(
          indyCredDefId.namespaceIdentifier,
          indyCredDefId.schemaSeqNo,
          indyCredDefId.tag
        )

        registerCredentialDefinitionResult.credentialDefinitionState.credentialDefinitionId = getCredentialDefinitionId
        return registerCredentialDefinitionResult?.credentialDefinitionState
      }
      return registerCredentialDefinitionResult
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/credential-definition/:credentialDefinitionId/:tenantId')
  public async getCredentialDefinitionById(
    @Path('credentialDefinitionId') credentialDefinitionId: CredentialDefinitionId,
    @Path('tenantId') tenantId: string
  ) {
    let credentialDefinitionResult: any
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        credentialDefinitionResult = await tenantAgent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)
      })

      if (credentialDefinitionResult.resolutionMetadata?.error === SchemaError.NotFound) {
        throw new NotFoundError(credentialDefinitionResult.resolutionMetadata.message)
      }
      const error = credentialDefinitionResult.resolutionMetadata?.error

      if (error === 'invalid' || error === SchemaError.UnSupportedAnonCredsMethod) {
        throw new BadRequestError(credentialDefinitionResult.resolutionMetadata.message)
      }

      if (error !== undefined || credentialDefinitionResult.credentialDefinition === undefined) {
        throw new InternalServerError(credentialDefinitionResult.resolutionMetadata.message)
      }

      return credentialDefinitionResult
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/credentials/create-offer/:tenantId')
  public async createOffer(@Body() createOfferOptions: CreateOfferOptions, @Path('tenantId') tenantId: string) {
    let offer
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        offer = await tenantAgent.credentials.offerCredential({
          connectionId: createOfferOptions.connectionId,
          protocolVersion: createOfferOptions.protocolVersion as CredentialProtocolVersionType<[]>,
          credentialFormats: createOfferOptions.credentialFormats,
          autoAcceptCredential: createOfferOptions.autoAcceptCredential,
        })
      })

      return offer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/credentials/create-offer-oob/:tenantId')
  public async createOfferOob(@Path('tenantId') tenantId: string, @Body() createOfferOptions: CreateOfferOobOptions) {
    let createOfferOobRecord

    try {
      let invitationDid: string | undefined
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const linkSecretIds = await tenantAgent.modules.anoncreds.getLinkSecretIds()
        if (linkSecretIds.length === 0) {
          await tenantAgent.modules.anoncreds.createLinkSecret()
        }

        if (createOfferOptions?.invitationDid) {
          invitationDid = createOfferOptions?.invitationDid
        } else {
          const didRouting = await tenantAgent.mediationRecipient.getRouting({})
          const didDocument = createPeerDidDocumentFromServices([
            {
              id: 'didcomm',
              recipientKeys: [didRouting.recipientKey],
              routingKeys: didRouting.routingKeys,
              serviceEndpoint: didRouting.endpoints[0],
            },
          ])
          const did = await tenantAgent.dids.create<PeerDidNumAlgo2CreateOptions>({
            didDocument,
            method: 'peer',
            options: {
              numAlgo: PeerDidNumAlgo.MultipleInceptionKeyWithoutDoc,
            },
          })
          invitationDid = did.didState.did
        }

        const offerOob = await tenantAgent.credentials.createOffer({
          protocolVersion: createOfferOptions.protocolVersion as CredentialProtocolVersionType<[]>,
          credentialFormats: createOfferOptions.credentialFormats,
          autoAcceptCredential: createOfferOptions.autoAcceptCredential,
          comment: createOfferOptions.comment,
        })

        const credentialMessage = offerOob.message
        const outOfBandRecord = await tenantAgent.oob.createInvitation({
          label: createOfferOptions.label,
          messages: [credentialMessage],
          autoAcceptConnection: true,
          imageUrl: createOfferOptions?.imageUrl,
          goalCode: createOfferOptions?.goalCode,
          invitationDid,
        })

        createOfferOobRecord = {
          invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
            domain: this.agent.config.endpoints[0],
          }),
          invitation: outOfBandRecord.outOfBandInvitation.toJSON({
            useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
          }),
          outOfBandRecord: outOfBandRecord.toJSON(),
          outOfBandRecordId: outOfBandRecord.id,
          credentialRequestThId: offerOob.credentialRecord.threadId,
          invitationDid: createOfferOptions?.invitationDid ? '' : invitationDid,
        }
      })
      return createOfferOobRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/credentials/accept-offer/:tenantId')
  public async acceptOffer(
    @Path('tenantId') tenantId: string,
    @Body() acceptCredentialOfferOptions: AcceptCredentialOfferOptions
  ) {
    let acceptOffer
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const linkSecretIds = await tenantAgent.modules.anoncreds.getLinkSecretIds()
        if (linkSecretIds.length === 0) {
          await tenantAgent.modules.anoncreds.createLinkSecret()
        }
        acceptOffer = await tenantAgent.credentials.acceptOffer({
          credentialRecordId: acceptCredentialOfferOptions.credentialRecordId,
          credentialFormats: acceptCredentialOfferOptions.credentialFormats,
          autoAcceptCredential: acceptCredentialOfferOptions.autoAcceptCredential,
          comment: acceptCredentialOfferOptions.comment,
        })
      })

      return acceptOffer
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/credentials/:credentialRecordId/:tenantId')
  public async getCredentialById(
    @Path('credentialRecordId') credentialRecordId: RecordId,
    @Path('tenantId') tenantId: string
  ) {
    let credentialRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const credential = await tenantAgent.credentials.getById(credentialRecordId)
        credentialRecord = credential.toJSON()
      })

      return credentialRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/credentials/:tenantId')
  public async getAllCredentials(
    @Path('tenantId') tenantId: string,
    @Query('threadId') threadId?: string,
    @Query('connectionId') connectionId?: string,
    @Query('state') state?: CredentialState
  ) {
    let credentialRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const credentialRepository = tenantAgent.dependencyManager.resolve(CredentialRepository)
        const credentials = await credentialRepository.findByQuery(tenantAgent.context, {
          connectionId,
          threadId,
          state,
        })
        credentialRecord = credentials.map((c: any) => c.toJSON())
      })
      return credentialRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/proofs/:tenantId')
  public async getAllProofs(@Path('tenantId') tenantId: string, @Query('threadId') threadId?: string) {
    let proofRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        let proofs = await tenantAgent.proofs.getAll()
        if (threadId) proofs = proofs.filter((p: any) => p.threadId === threadId)
        proofRecord = proofs.map((proof: any) => proof.toJSON())
      })
      return proofRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/form-data/:tenantId/:proofRecordId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async proofFormData(@Path('proofRecordId') proofRecordId: string, @Path('tenantId') tenantId: string) {
    let proof
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        proof = await tenantAgent.proofs.getFormatData(proofRecordId)
      })
      return proof
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/proofs/request-proof/:tenantId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async requestProof(@Body() requestProofOptions: RequestProofOptions, @Path('tenantId') tenantId: string) {
    let proof
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const requestProofPayload = {
          connectionId: requestProofOptions.connectionId,
          protocolVersion: requestProofOptions.protocolVersion as ProofsProtocolVersionType<[]>,
          comment: requestProofOptions.comment,
          proofFormats: requestProofOptions.proofFormats,
          autoAcceptProof: requestProofOptions.autoAcceptProof,
          goalCode: requestProofOptions.goalCode,
          parentThreadId: requestProofOptions.parentThreadId,
          willConfirm: requestProofOptions.willConfirm,
        }
        proof = await tenantAgent.proofs.requestProof(requestProofPayload)
      })

      return proof
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/proofs/create-request-oob/:tenantId')
  public async createRequest(
    @Path('tenantId') tenantId: string,
    @Body() createRequestOptions: CreateProofRequestOobOptions
  ) {
    let oobProofRecord
    try {
      let invitationDid: string | undefined
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (createRequestOptions?.invitationDid) {
          invitationDid = createRequestOptions?.invitationDid
        } else {
          const didRouting = await tenantAgent.mediationRecipient.getRouting({})
          const didDocument = createPeerDidDocumentFromServices([
            {
              id: 'didcomm',
              recipientKeys: [didRouting.recipientKey],
              routingKeys: didRouting.routingKeys,
              serviceEndpoint: didRouting.endpoints[0],
            },
          ])
          const did = await tenantAgent.dids.create<PeerDidNumAlgo2CreateOptions>({
            didDocument,
            method: 'peer',
            options: {
              numAlgo: PeerDidNumAlgo.MultipleInceptionKeyWithoutDoc,
            },
          })
          invitationDid = did.didState.did
        }
        const proof = await tenantAgent.proofs.createRequest({
          protocolVersion: createRequestOptions.protocolVersion as ProofsProtocolVersionType<[]>,
          proofFormats: createRequestOptions.proofFormats,
          goalCode: createRequestOptions.goalCode,
          willConfirm: createRequestOptions.willConfirm,
          parentThreadId: createRequestOptions.parentThreadId,
          autoAcceptProof: createRequestOptions.autoAcceptProof,
          comment: createRequestOptions.comment,
        })

        const proofMessage = proof.message
        const outOfBandRecord = await tenantAgent.oob.createInvitation({
          label: createRequestOptions.label,
          messages: [proofMessage],
          autoAcceptConnection: true,
          imageUrl: createRequestOptions?.imageUrl,
          invitationDid,
          goalCode: createRequestOptions?.goalCode,
        })

        oobProofRecord = {
          invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
            domain: this.agent.config.endpoints[0],
          }),
          invitation: outOfBandRecord.outOfBandInvitation.toJSON({
            useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
          }),
          outOfBandRecord: outOfBandRecord.toJSON(),
          proofRecordThId: proof.proofRecord.threadId,
          proofMessageId: proof.message.thread?.threadId
            ? proof.message.thread?.threadId
            : proof.message.threadId
            ? proof.message.thread
            : proof.message.id,
          invitationDid: createRequestOptions?.invitationDid ? '' : invitationDid,
        }
      })

      return oobProofRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/proofs/:proofRecordId/accept-request/:tenantId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptRequest(
    @Path('tenantId') tenantId: string,
    @Path('proofRecordId') proofRecordId: string,
    @Body()
    request: //TODO type for request
    {
      filterByPresentationPreview?: boolean
      filterByNonRevocationRequirements?: boolean
      comment?: string
    }
  ) {
    let proofRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const requestedCredentials = await tenantAgent.proofs.selectCredentialsForRequest({
          proofRecordId,
        })
        const acceptProofRequest: AcceptProofRequestOptions = {
          proofRecordId,
          comment: request.comment,
          proofFormats: requestedCredentials.proofFormats,
        }
        const proof = await tenantAgent.proofs.acceptRequest(acceptProofRequest)

        proofRecord = proof.toJSON()
      })
      return proofRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/proofs/:proofRecordId/accept-presentation/:tenantId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptPresentation(@Path('tenantId') tenantId: string, @Path('proofRecordId') proofRecordId: string) {
    let proof
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        proof = await tenantAgent.proofs.acceptPresentation({ proofRecordId })
      })
      return proof
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Get('/proofs/:proofRecordId/:tenantId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async getProofById(@Path('tenantId') tenantId: string, @Path('proofRecordId') proofRecordId: RecordId) {
    let proofRecord
    try {
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const proof = await tenantAgent.proofs.getById(proofRecordId)
        proofRecord = proof.toJSON()
      })
      return proofRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Delete(':tenantId')
  public async deleteTenantById(@Path('tenantId') tenantId: string) {
    try {
      const deleteTenant = await this.agent.modules.tenants.deleteTenantById(tenantId)
      return JsonTransformer.toJSON(deleteTenant)
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/did/web/:tenantId')
  public async createDidWeb(@Path('tenantId') tenantId: string, @Body() didOptions: DidCreate) {
    try {
      let didDoc
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (!didOptions.seed) {
          throw Error('Seed is required')
        }
        if (!didOptions.keyType) {
          throw new BadRequestError('keyType is required')
        }
        if (!didOptions.domain) {
          throw new BadRequestError('domain is required')
        }
        if (didOptions.keyType !== KeyType.Ed25519 && didOptions.keyType !== KeyType.Bls12381g2) {
          throw Error('Only ed25519 and bls12381g2 key type supported')
        }
        const did = `did:${didOptions.method}:${didOptions.domain}`
        let didDocument: any
        const keyId = `${did}#key-1`
        const key = await tenantAgent.wallet.createKey({
          keyType: didOptions.keyType,
          seed: TypedArrayEncoder.fromString(didOptions.seed),
        })
        if (didOptions.keyType === 'ed25519') {
          didDocument = new DidDocumentBuilder(did)
            .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
            .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
            .addAuthentication(keyId)
            .build()
        }
        if (didOptions.keyType === 'bls12381g2') {
          didDocument = new DidDocumentBuilder(did)
            .addContext('https://w3id.org/security/bbs/v1')
            .addVerificationMethod(getBls12381G2Key2020({ key, id: keyId, controller: did }))
            .addAuthentication(keyId)
            .build()
        }

        didDoc = {
          did,
          didDocument: didDocument.toJSON(),
        }
      })
      return didDoc
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  @Security('apiKey')
  @Post('/did/key:tenantId')
  public async createDidKey(@Path('tenantId') tenantId: string, @Body() didOptions: DidCreate) {
    try {
      let didCreateResponse
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        if (!didOptions.seed) {
          throw new BadRequestError('Seed is required')
        }
        didCreateResponse = await tenantAgent.dids.create<KeyDidCreateOptions>({
          //TODO enum for method
          method: 'key',
          options: {
            keyType: KeyType.Ed25519,
          },
          secret: {
            privateKey: TypedArrayEncoder.fromString(didOptions.seed),
          },
        })
      })
      return didCreateResponse
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Retrieve question and answer records by query
   *
   * @param tenantId Tenant identifier
   * @param connectionId Connection identifier
   * @param role Role of the question
   * @param state State of the question
   * @param threadId Thread identifier
   * @returns QuestionAnswerRecord[]
   */
  @Security('apiKey')
  @Get('/question-answer/:tenantId')
  public async getQuestionAnswerRecords(
    @Path('tenantId') tenantId: string,
    @Query('connectionId') connectionId?: string,
    @Query('role') role?: QuestionAnswerRole,
    @Query('state') state?: QuestionAnswerState,
    @Query('threadId') threadId?: string
  ) {
    try {
      let questionAnswerRecords: QuestionAnswerRecord[] = []
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        questionAnswerRecords = await tenantAgent.modules.questionAnswer.findAllByQuery({
          connectionId,
          role,
          state,
          threadId,
        })
      })
      return questionAnswerRecords.map((record) => record.toJSON())
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Send a question to a connection
   *
   * @param tenantId Tenant identifier
   * @param connectionId Connection identifier
   * @param content The content of the message
   */
  @Security('apiKey')
  @Post('/question-answer/question/:connectionId/:tenantId')
  public async sendQuestion(
    @Path('connectionId') connectionId: RecordId,
    @Path('tenantId') tenantId: string,
    @Body()
    config: //TODO type for config
    {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    try {
      const { question, validResponses, detail } = config
      let questionAnswerRecord
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        questionAnswerRecord = await tenantAgent.modules.questionAnswer.sendQuestion(connectionId, {
          question,
          validResponses,
          detail,
        })
        questionAnswerRecord = questionAnswerRecord?.toJSON()
      })
      return questionAnswerRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Send a answer to question
   *
   * @param tenantId Tenant identifier
   * @param id Question Answer Record identifier
   * @param response The response of the question
   */
  @Security('apiKey')
  @Post('/question-answer/answer/:id/:tenantId')
  public async sendAnswer(
    @Path('id') id: RecordId,
    @Path('tenantId') tenantId: string,
    @Body() request: Record<'response', string>
  ) {
    try {
      let questionAnswerRecord
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const record = await tenantAgent.modules.questionAnswer.sendAnswer(id, request.response)
        questionAnswerRecord = record.toJSON()
      })
      return questionAnswerRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Retrieve question answer record by id
   *
   * @param id Question Answer Record identifier
   * @param tenantId Tenant identifier
   * @returns ConnectionRecord
   */
  @Security('apiKey')
  @Get('/question-answer/:id/:tenantId')
  public async getQuestionAnswerRecordById(@Path('id') id: RecordId, @Path('tenantId') tenantId: string) {
    try {
      let questionAnswerRecord
      await this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
        const record = await tenantAgent.modules.questionAnswer.findById(id)
        questionAnswerRecord = record
      })
      if (!questionAnswerRecord) {
        throw new NotFoundError(`Question Answer Record with id "${id}" not found.`)
      }
      return questionAnswerRecord
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
