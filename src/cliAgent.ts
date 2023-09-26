import { InitConfig, AutoAcceptCredential, AutoAcceptProof, DidsModule, ProofsModule, V2ProofProtocol, CredentialsModule, V2CredentialProtocol, ConnectionsModule, W3cCredentialsModule, KeyDidRegistrar, KeyDidResolver, CacheModule, InMemoryLruCache, WebDidResolver } from '@aries-framework/core'
import type { WalletConfig } from '@aries-framework/core/build/types'

import { HttpOutboundTransport, WsOutboundTransport, LogLevel, Agent } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport, WsInboundTransport } from '@aries-framework/node'
import { readFile } from 'fs/promises'
import { BCOVRIN_TEST_GENESIS, INDICIO_TEST_GENESIS } from './utils/util'

import { setupServer } from './server'
import { TsLogger } from './utils/logger'
import { AnonCredsModule, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
import { randomUUID } from 'crypto'
import { TenantsModule } from '@aries-framework/tenants'
import { JsonLdCredentialFormatService } from '@aries-framework/core'
import { W3cCredentialSchema, W3cCredentialsApi, W3cCredentialService, W3cJsonLdVerifyCredentialOptions } from '@aries-framework/core'
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@aries-framework/askar'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { IndyVdrAnonCredsRegistry, IndyVdrIndyDidResolver, IndyVdrModule, IndyVdrPoolConfig, IndyVdrIndyDidRegistrar } from '@aries-framework/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'

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

export interface AriesRestConfig {
  label: string
  walletConfig: WalletConfig
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
  indyLedger?: any[]
  webhookUrl?: string
  adminPort: number
}

export async function readRestConfig(path: string) {
  const configString = await readFile(path, { encoding: 'utf-8' })
  const config = JSON.parse(configString)

  return config
}

export async function runRestAgent(restConfig: AriesRestConfig) {
  const { logLevel, inboundTransports = [], outboundTransports = [], webhookUrl, adminPort, walletConfig, ...afjConfig } = restConfig

  const logger = new TsLogger(logLevel ?? LogLevel.error)

  const agentConfig: InitConfig = {
    walletConfig: {
      id: walletConfig.id,
      key: walletConfig.key,
      storage: walletConfig.storage
    },
    ...afjConfig,
    logger
  };

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()
  const jsonLdCredentialFormatService = new JsonLdCredentialFormatService()

  let networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]] = [
    {
      genesisTransactions: '',
      indyNamespace: '',
      isProduction: false,
      connectOnStartup: true
    }
  ];

  if (afjConfig?.indyLedger?.includes("bcovrin") && afjConfig?.indyLedger?.includes("indicio")) {
    networkConfig = [
      {
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin',
        isProduction: false,
        connectOnStartup: true
      },
      {
        genesisTransactions: INDICIO_TEST_GENESIS,
        indyNamespace: 'indicio',
        isProduction: false,
        connectOnStartup: true,
        transactionAuthorAgreement: { version: '1.0', acceptanceMechanism: 'wallet_agreement' }
      }
    ];
  } else if (afjConfig?.indyLedger?.includes("indicio")) {
    networkConfig = [
      {
        genesisTransactions: INDICIO_TEST_GENESIS,
        indyNamespace: 'indicio',
        isProduction: false,
        connectOnStartup: true,
        transactionAuthorAgreement: { version: '1.0', acceptanceMechanism: 'wallet_agreement' }
      }
    ];
  } else if (afjConfig?.indyLedger?.includes("bcovrin")) {
    networkConfig = [
      {
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin',
        isProduction: false,
        connectOnStartup: true
      }
    ];
  } else {
    networkConfig = [
      {
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin',
        isProduction: false,
        connectOnStartup: true
      }
    ];
  }

  const agent = new Agent({
    config: agentConfig,
    modules: {
      ...(afjConfig.tenancy
        ? {
          tenants: new TenantsModule({
            sessionAcquireTimeout: Infinity,
            sessionLimit: Infinity,
          }),
        }
        : {}),

      askar: new AskarModule({
        ariesAskar,
        multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet, 
      }),

      indyVdr: new IndyVdrModule({
        indyVdr,
        networks: networkConfig
      }),

      dids: new DidsModule({
        registrars: [new IndyVdrIndyDidRegistrar(), new KeyDidRegistrar()],
        resolvers: [new IndyVdrIndyDidResolver(), new KeyDidResolver(), new WebDidResolver()],
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry()],
      }),
      // Use anoncreds-rs as anoncreds backend
      _anoncreds: new AnonCredsRsModule({
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
            proofFormats: [legacyIndyProofFormat],
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
            credentialFormats: [legacyIndyCredentialFormat, jsonLdCredentialFormatService],
          }),
        ],
      }),
      w3cCredentials: new W3cCredentialsModule(),
      cache: new CacheModule({
        cache: new InMemoryLruCache({ limit: Infinity })
      })
    },
    dependencies: agentDependencies,
  });

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
  const app = await setupServer(agent, {
    webhookUrl,
    port: adminPort,
  })

  app.listen(adminPort, () => {
    logger.info(`Successfully started server on port ${adminPort}`)
  })
}
