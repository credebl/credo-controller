import { InitConfig, AutoAcceptCredential, AutoAcceptProof, DidsModule, ProofsModule, V2ProofProtocol, CredentialsModule, V2CredentialProtocol, ConnectionsModule, W3cCredentialsModule, KeyDidRegistrar, KeyDidResolver, CacheModule, InMemoryLruCache, WebDidResolver } from '@aries-framework/core'
import type { WalletConfig } from '@aries-framework/core/build/types'

import { HttpOutboundTransport, WsOutboundTransport, LogLevel, Agent } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport, WsInboundTransport } from '@aries-framework/node'
import { readFile } from 'fs/promises'
import { BCOVRIN_TEST_GENESIS, INDICIO_TEST_GENESIS } from './utils/util'

import { setupServer } from './server'
import { TsLogger } from './utils/logger'
import { AnonCredsCredentialFormatService, AnonCredsModule, AnonCredsProofFormatService, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
import { randomBytes, randomUUID } from 'crypto'
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
import jwt from 'jsonwebtoken';

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

export type RestAgentModules = Awaited<ReturnType<typeof getModules>>


const getWithTenantModules = (networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]) => {
  const modules = getModules(networkConfig)
  return {
    tenants: new TenantsModule<typeof modules>({
      sessionAcquireTimeout: Infinity,
      sessionLimit: Infinity
    }),
    ...modules
  }
}

const getModules = (networkConfig: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]) => {
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

      if (ledgerConfig.indyNamespace === 'indicio:testnet' || ledgerConfig.indyNamespace === 'indicio:mainnet') {
        networkConfig.transactionAuthorAgreement = {
          version: '1.0',
          acceptanceMechanism: 'wallet_agreement',
        };
      } else {
        networkConfig.transactionAuthorAgreement = {
          version: '1.3',
          acceptanceMechanism: 'wallet_agreement',
        };
      }
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

  const tenantModule = await getWithTenantModules(networkConfig)
  const modules = getModules(networkConfig)
  const agent = new Agent({
    config: agentConfig,
    modules: {
      ...(afjConfig.tenancy
        ? {
          ...tenantModule
        }
        : {}),
      ...modules,
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

  let token: string = '';
  const genericRecord = await agent.genericRecords.getAll();
  console.log(genericRecord)
  if (genericRecord.length === 0) {

    async function generateSecretKey(length: number = 32): Promise<string> {
      try {
        // Asynchronously generate a buffer containing random values
        const buffer: Buffer = await new Promise((resolve, reject) => {
          randomBytes(length, (error, buf) => {
            if (error) {
              reject(error);
            } else {
              resolve(buf);
            }
          });
        });

        // Convert the buffer to a hexadecimal string
        const secretKey: string = buffer.toString("hex");

        return secretKey;
      } catch (error) {
        // Handle any errors that might occur during key generation
        logger.error(`Error generating secret key: ${error}`);
        throw error;
      }
    }

    // Call the async function
    const secretKeyInfo: string = await generateSecretKey();
    // Check if the secretKey already exist in the genericRecords

    // if already exist - then don't generate the secret key again
    // Check if the JWT token already available in genericRecords - if yes, and also don't generate the JWT token
    // instead use the existin JWT token
    // if JWT token is not found, create/generate a new token and save in genericRecords
    // next time, the same token should be used - instead of creating a new token on every restart event of the agent

    token = jwt.sign({ agentInfo: 'agentInfo' }, secretKeyInfo);

    await agent.genericRecords.save({
      content: {
        secretKey: secretKeyInfo,
        token
      },
    });
  } else {
    token = genericRecord[0]?.content?.token as string;
  }

  const app = await setupServer(agent, {
    webhookUrl,
    port: adminPort,
  },
    token
  )

  logger.info(`*** API Toekn: ${token}`);

  app.listen(adminPort, () => {
    logger.info(`Successfully started server on port ${adminPort}`)
  })
}
