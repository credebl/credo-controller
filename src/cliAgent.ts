import type { InitConfig } from '@aries-framework/core'
import type { WalletConfig } from '@aries-framework/core/build/types'
import type { IndyVdrPoolConfig } from '@aries-framework/indy-vdr'

import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from '@aries-framework/anoncreds'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@aries-framework/askar'
import {
  AutoAcceptCredential,
  AutoAcceptProof,
  DidsModule,
  ProofsModule,
  V2ProofProtocol,
  CredentialsModule,
  V2CredentialProtocol,
  ConnectionsModule,
  W3cCredentialsModule,
  KeyDidRegistrar,
  KeyDidResolver,
  CacheModule,
  InMemoryLruCache,
  WebDidResolver,
  PresentationExchangeProofFormatService,
  HttpOutboundTransport,
  WsOutboundTransport,
  LogLevel,
  Agent,
  JsonLdCredentialFormatService,
} from '@aries-framework/core'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrIndyDidRegistrar,
} from '@aries-framework/indy-vdr'
import { agentDependencies, HttpInboundTransport, WsInboundTransport } from '@aries-framework/node'
import { QuestionAnswerModule } from '@aries-framework/question-answer'
import { TenantsModule } from '@aries-framework/tenants'
import { PolygonDidRegistrar, PolygonDidResolver, PolygonModule } from '@ayanworks/credo-polygon-w3c-module'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import axios from 'axios'
import { readFile } from 'fs/promises'
import jwt from 'jsonwebtoken'

import { AgentRole } from './enums/enum'
// eslint-disable-next-line import/no-cycle
import { setupServer } from './server'
import { generateSecretKey } from './utils/common.service'
import { TsLogger } from './utils/logger'
import { BCOVRIN_TEST_GENESIS } from './utils/util'

export type Transports = 'ws' | 'http'
export type InboundTransport = {
  transport: Transports
  port: number
}

const inboundTransportMapping = {
  http: HttpInboundTransport,
  ws: WsInboundTransport,
} as const

const outboundTransportMapping = {
  http: HttpOutboundTransport,
  ws: WsOutboundTransport,
} as const

interface indyLedger {
  genesisTransactions: string
  indyNamespace: string
}
export interface AriesRestConfig {
  label: string
  walletConfig: WalletConfig
  indyLedger: indyLedger[]
  publicDidSeed?: string
  endpoints?: string[]
  autoAcceptConnections?: boolean
  autoAcceptCredentials?: AutoAcceptCredential
  autoAcceptProofs?: AutoAcceptProof
  useLegacyDidSovPrefix?: boolean
  logLevel?: LogLevel
  inboundTransports?: InboundTransport[]
  outboundTransports?: Transports[]
  autoAcceptMediationRequests?: boolean
  connectionImageUrl?: string
  tenancy?: boolean
  webhookUrl?: string
  adminPort: number
  didRegistryContractAddress: string
  schemaManagerContractAddress: string
  rpcUrl: string
  fileServerUrl: string
  fileServerToken: string
}

export async function readRestConfig(path: string) {
  const configString = await readFile(path, { encoding: 'utf-8' })
  const config = JSON.parse(configString)

  return config
}

export type RestMultiTenantAgentModules = Awaited<ReturnType<typeof getWithTenantModules>>

export type RestAgentModules = Awaited<ReturnType<typeof getModules>>

// export type RestMultiTenantAgentModules = Awaited<ReturnType<typeof getWithTenantModules>>
// type RestRootAgentWithTenantsModules = Awaited<ReturnType<typeof getWithTenantModules>>
// type RestRootAgentModules = Awaited<ReturnType<typeof getModules>>
// export type RestMultiTenantAgentModules = Agent<RestRootAgentWithTenantsModules>
// export type RestAgentModules = Agent<RestRootAgentModules>

const getModules = (networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]) => {
  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()
  const jsonLdCredentialFormatService = new JsonLdCredentialFormatService()
  const anonCredsCredentialFormatService = new AnonCredsCredentialFormatService()
  const anonCredsProofFormatService = new AnonCredsProofFormatService()
  const presentationExchangeProofFormatService = new PresentationExchangeProofFormatService()
  return {
    askar: new AskarModule({
      ariesAskar,
      multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    }),

    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: networkConfig,
    }),

    dids: new DidsModule({
      registrars: [new IndyVdrIndyDidRegistrar(), new KeyDidRegistrar(), new PolygonDidRegistrar()],
      resolvers: [new IndyVdrIndyDidResolver(), new KeyDidResolver(), new WebDidResolver(), new PolygonDidResolver()],
    }),

    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
    }),

    // Use anoncreds-rs as anoncreds backend
    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),

    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),
    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.ContentApproved,
      proofProtocols: [
        new V1ProofProtocol({
          indyProofFormat: legacyIndyProofFormat,
        }),
        new V2ProofProtocol({
          proofFormats: [legacyIndyProofFormat, anonCredsProofFormatService, presentationExchangeProofFormatService],
        }),
      ],
    }),
    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.Always,
      credentialProtocols: [
        new V1CredentialProtocol({
          indyCredentialFormat: legacyIndyCredentialFormat,
        }),
        new V2CredentialProtocol({
          credentialFormats: [
            legacyIndyCredentialFormat,
            jsonLdCredentialFormatService,
            anonCredsCredentialFormatService,
          ],
        }),
      ],
    }),
    w3cCredentials: new W3cCredentialsModule(),
    cache: new CacheModule({
      cache: new InMemoryLruCache({ limit: Infinity }),
    }),

    questionAnswer: new QuestionAnswerModule(),
    polygon: new PolygonModule({
      didContractAddress: '0x12513116875BB3E4F098Ce74624739Ee51bAf023',
      schemaManagerContractAddress: '0x552992e9f14b15bBd76488cD4c38c89B80259f37',
      fileServerToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJBeWFuV29ya3MiLCJpZCI6ImNhZDI3ZjhjLTMyNWYtNDRmZC04ZmZkLWExNGNhZTY3NTMyMSJ9.I3IR7abjWbfStnxzn1BhxhV0OEzt1x3mULjDdUcgWHk',
      rpcUrl: 'https://polygon-mumbai.infura.io/v3/0579d305568d404e996e49695e9272a3',
      serverUrl: 'https://schema.credebl.id/',
    }),
  }
}

const getWithTenantModules = (networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]) => {
  const modules = getModules(networkConfig)
  return {
    tenants: new TenantsModule<typeof modules>({
      sessionAcquireTimeout: Infinity,
      sessionLimit: Infinity,
    }),
    ...modules,
  }
}

// Add this function in common service
// async function generateSecretKey(length: number = 32): Promise<string> {
//   // Asynchronously generate a buffer containing random values
//   const buffer: Buffer = await new Promise((resolve, reject) => {
//     randomBytes(length, (error, buf) => {
//       if (error) {
//         reject(error)
//       } else {
//         resolve(buf)
//       }
//     })
//   })

//   // Convert the buffer to a hexadecimal string
//   const secretKey: string = buffer.toString('hex')

//   return secretKey
// }

export async function runRestAgent(restConfig: AriesRestConfig) {
  const {
    logLevel,
    inboundTransports = [],
    outboundTransports = [],
    webhookUrl,
    adminPort,
    walletConfig,
    ...afjConfig
  } = restConfig

  const logger = new TsLogger(logLevel ?? LogLevel.error)

  const agentConfig: InitConfig = {
    walletConfig: {
      id: walletConfig.id,
      key: walletConfig.key,
      storage: walletConfig.storage,
    },
    ...afjConfig,
    logger,
  }

  async function fetchLedgerData(ledgerConfig: {
    genesisTransactions: string
    indyNamespace: string
  }): Promise<IndyVdrPoolConfig> {
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/

    if (!urlPattern.test(ledgerConfig.genesisTransactions)) {
      throw new Error('Not a valid URL')
    }

    const genesisTransactions = await axios.get(ledgerConfig.genesisTransactions)

    const networkConfig: IndyVdrPoolConfig = {
      genesisTransactions: genesisTransactions.data,
      indyNamespace: ledgerConfig.indyNamespace,
      isProduction: false,
      connectOnStartup: true,
    }

    if (ledgerConfig.indyNamespace.includes('indicio')) {
      if (ledgerConfig.indyNamespace === 'indicio:testnet' || ledgerConfig.indyNamespace === 'indicio:mainnet') {
        networkConfig.transactionAuthorAgreement = {
          version: '1.0',
          acceptanceMechanism: 'wallet_agreement',
        }
      } else {
        networkConfig.transactionAuthorAgreement = {
          version: '1.3',
          acceptanceMechanism: 'wallet_agreement',
        }
      }
    }

    return networkConfig
  }

  let networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]

  const parseIndyLedger = afjConfig?.indyLedger
  if (parseIndyLedger.length !== 0) {
    networkConfig = [
      await fetchLedgerData(parseIndyLedger[0]),
      ...(await Promise.all(parseIndyLedger.slice(1).map(fetchLedgerData))),
    ]
  } else {
    networkConfig = [
      {
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin:testnet',
        isProduction: false,
        connectOnStartup: true,
      },
    ]
  }

  const tenantModule = await getWithTenantModules(networkConfig)
  const modules = getModules(networkConfig)
  const agent = new Agent({
    config: agentConfig,
    modules: {
      ...(afjConfig.tenancy
        ? {
            ...tenantModule,
          }
        : {}),
      ...modules,
    },
    dependencies: agentDependencies,
  })

  // Register outbound transports
  for (const outboundTransport of outboundTransports) {
    const OutboundTransport = outboundTransportMapping[outboundTransport]
    agent.registerOutboundTransport(new OutboundTransport())
  }

  // Register inbound transports
  for (const inboundTransport of inboundTransports) {
    const InboundTransport = inboundTransportMapping[inboundTransport.transport]
    agent.registerInboundTransport(new InboundTransport({ port: inboundTransport.port }))
  }

  await agent.initialize()

  // Add the agent context to container in tsyringe
  // container.registerInstance(Agent, agent as Agent)

  let token: string = ''
  const genericRecord = await agent.genericRecords.getAll()

  const recordsWithToken = genericRecord.some((record) => record?.content?.token)
  if (!genericRecord.length || !recordsWithToken) {
    // Call the async function
    const secretKeyInfo: string = await generateSecretKey()
    // Check if the secretKey already exist in the genericRecords

    // if already exist - then don't generate the secret key again
    // Check if the JWT token already available in genericRecords - if yes, and also don't generate the JWT token
    // instead use the existin JWT token
    // if JWT token is not found, create/generate a new token and save in genericRecords
    // next time, the same token should be used - instead of creating a new token on every restart event of the agent

    // if already exist - then don't generate the secret key again
    // Check if the JWT token already available in genericRecords - if yes, and also don't generate the JWT token
    // instead use the existin JWT token
    // if JWT token is not found, create/generate a new token and save in genericRecords
    // next time, the same token should be used - instead of creating a new token on every restart event of the agent

    // Krish: Should add agent role and tenant id in case of tenants
    // token = jwt.sign({ agentInfo: 'agentInfo' }, secretKeyInfo)

    // agent role set for dedicated agent and base-wallet respectively
    if (!('tenants' in agent.modules)) {
      token = jwt.sign({ role: AgentRole.RestRootAgent }, secretKeyInfo)
    } else {
      token = jwt.sign({ role: AgentRole.RestRootAgentWithTenants }, secretKeyInfo)
    }

    // Krish: there should be no need to store the token if it is a refresh token. It's okay to save it for now and return it in the additional endpoint
    console.log('--------------if---------------', token)
    await agent.genericRecords.save({
      content: {
        secretKey: secretKeyInfo,
        token,
      },
    })
  } else {
    const recordWithToken = genericRecord.find((record) => record?.content?.token !== undefined)
    token = recordWithToken?.content.token as string
    console.log('--------------else---------------', token)
  }

  const app = await setupServer(
    agent,
    {
      webhookUrl,
      port: adminPort,
    },
    token
  )

  logger.info(`*** API Token: ${token}`)

  app.listen(adminPort, () => {
    logger.info(`Successfully started server on port ${adminPort}`)
  })
}
