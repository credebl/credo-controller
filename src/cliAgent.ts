import { InitConfig, AutoAcceptCredential, AutoAcceptProof, DidsModule, ProofsModule, V2ProofProtocol, CredentialsModule, V2CredentialProtocol, ConnectionsModule, W3cCredentialsModule, KeyDidRegistrar, KeyDidResolver, CacheModule, InMemoryLruCache } from '@aries-framework/core'
import type { WalletConfig } from '@aries-framework/core/build/types'

import { HttpOutboundTransport, WsOutboundTransport, LogLevel, Agent } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport, IndySdkPostgresWalletScheme, loadIndySdkPostgresPlugin, WsInboundTransport } from '@aries-framework/node'
import { readFile } from 'fs/promises'
import { IndySdkAnonCredsRegistry, IndySdkIndyDidResolver, IndySdkModule, IndySdkIndyDidRegistrar, IndySdkPoolConfig } from '@aries-framework/indy-sdk'
import indySdk from 'indy-sdk'
import { BCOVRIN_TEST_GENESIS, INDICIO_TEST_GENESIS } from './utils/util'

import { setupServer } from './server'
import { TsLogger } from './utils/logger'
import { AnonCredsModule, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
import { randomUUID } from 'crypto'
import { TenantsModule } from '@aries-framework/tenants'
import { IndySdkPostgresWalletStorageConfig, IndySdkPostgresWalletStorageCredentials } from '@aries-framework/node/build/PostgresPlugin'
import { JsonLdCredentialFormatService } from '@aries-framework/core'
import { W3cCredentialSchema, W3cCredentialsApi, W3cCredentialService, W3cJsonLdVerifyCredentialOptions } from '@aries-framework/core'

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
  tenancy?: boolean,
  indyLedgers?: string[],
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

  loadIndySdkPostgresPlugin(walletConfig.storage?.config as IndySdkPostgresWalletStorageConfig, walletConfig.storage?.credentials as IndySdkPostgresWalletStorageCredentials);

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()
  const jsonLdCredentialFormatService = new JsonLdCredentialFormatService()

  let networkConfig: IndySdkPoolConfig[] = [
    {
      id: '',
      genesisTransactions: '',
      indyNamespace: '',
      isProduction: false,
      connectOnStartup: true
    }
  ];

  if (afjConfig?.indyLedgers?.includes("bcovrin") && afjConfig?.indyLedgers?.includes("indicio")) {
    networkConfig = [
      {
        id: randomUUID(),
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin',
        isProduction: false,
        connectOnStartup: true
      },
      {
        id: randomUUID(),
        genesisTransactions: INDICIO_TEST_GENESIS,
        indyNamespace: 'indicio',
        isProduction: false,
        connectOnStartup: true,
        transactionAuthorAgreement: { version: '1.0', acceptanceMechanism: 'wallet_agreement' }
      }
    ];
  } else if (afjConfig?.indyLedgers?.includes("indicio")) {
    networkConfig = [
      {
        id: randomUUID(),
        genesisTransactions: INDICIO_TEST_GENESIS,
        indyNamespace: 'indicio',
        isProduction: false,
        connectOnStartup: true,
        transactionAuthorAgreement: { version: '1.0', acceptanceMechanism: 'wallet_agreement' }
      }
    ];
  } else if (afjConfig?.indyLedgers?.includes("bcovrin")) {
    networkConfig = [
      {
        id: randomUUID(),
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin',
        isProduction: false,
        connectOnStartup: true
      }
    ];
  } else {
    networkConfig = [
      {
        id: randomUUID(),
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
      indySdk: new IndySdkModule({
        indySdk,
        networks: networkConfig
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndySdkAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        resolvers: [new IndySdkIndyDidResolver(), new KeyDidResolver()],
        registrars: [new IndySdkIndyDidRegistrar(), new KeyDidRegistrar()],
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
