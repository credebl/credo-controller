import { InitConfig, AutoAcceptCredential, AutoAcceptProof, DidsModule, ProofsModule, V2ProofProtocol, CredentialsModule, V2CredentialProtocol, ConnectionsModule, W3cCredentialsModule, KeyDidRegistrar, KeyDidResolver, CacheModule, InMemoryLruCache, WebDidResolver } from '@aries-framework/core'
import type { WalletConfig } from '@aries-framework/core/build/types'

import { HttpOutboundTransport, WsOutboundTransport, LogLevel, Agent } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport, WsInboundTransport } from '@aries-framework/node'
import { readFile } from 'fs/promises'
import { BCOVRIN_TEST_GENESIS, INDICIO_TEST_GENESIS } from './utils/util'

import { setupServer } from './server'
import { TsLogger } from './utils/logger'
import { AnonCredsCredentialFormatService, AnonCredsModule, AnonCredsProofFormatService, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
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
import axios from 'axios';

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
}

export async function readRestConfig(path: string) {
  const configString = await readFile(path, { encoding: 'utf-8' })
  const config = JSON.parse(configString)

  return config
}

export type RestMultiTenantAgentModules = Awaited<ReturnType<typeof getWithTenantModules>>

let networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]];


const getWithTenantModules = () => {
  const modules = getModules()
  return {
    tenants: new TenantsModule<typeof modules>({
      sessionAcquireTimeout: Infinity,
      sessionLimit: Infinity,
    }),
    ...modules
  }
}


const getModules = () => {
  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()
  const jsonLdCredentialFormatService = new JsonLdCredentialFormatService()
  const anonCredsCredentialFormatService = new AnonCredsCredentialFormatService()
  const anonCredsProofFormatService = new AnonCredsProofFormatService()
  return {
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
          proofFormats: [legacyIndyProofFormat, anonCredsProofFormatService],
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
          credentialFormats: [legacyIndyCredentialFormat, jsonLdCredentialFormatService, anonCredsCredentialFormatService],
        }),
      ],
    }),
    w3cCredentials: new W3cCredentialsModule(),
    cache: new CacheModule({
      cache: new InMemoryLruCache({ limit: Infinity })
    })
  }

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

  async function fetchLedgerData(ledgerConfig: any): Promise<IndyVdrPoolConfig> {
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;

    if (!urlPattern.test(ledgerConfig.genesisTransactions)) {
      throw new Error('Not a valid URL');
    }

    const genesisTransactions = await axios.get(ledgerConfig.genesisTransactions);

    const networkConfig: IndyVdrPoolConfig = {
      genesisTransactions: genesisTransactions.data,
      indyNamespace: ledgerConfig.indyNamespace,
      isProduction: false,
      connectOnStartup: true,
    };

    if (ledgerConfig.indyNamespace.includes('indicio')) {
      networkConfig.transactionAuthorAgreement = {
        version: '1.0',
        acceptanceMechanism: 'wallet_agreement',
      };
    }

    return networkConfig;
  }

  let networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]];

  const parseIndyLedger = afjConfig?.indyLedger;
  if (parseIndyLedger.length !== 0) {
    networkConfig = [await fetchLedgerData(parseIndyLedger[0]), ...await Promise.all(parseIndyLedger.slice(1).map(fetchLedgerData))];
  } else {
    networkConfig = [
      {
        genesisTransactions: BCOVRIN_TEST_GENESIS,
        indyNamespace: 'bcovrin:testnet',
        isProduction: false,
        connectOnStartup: true,
      },
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
