import { AutoAcceptCredential, CredentialsModule, DidsModule, InitConfig, ProofsModule, V2CredentialProtocol, V2ProofProtocol } from '@aries-framework/core'
import indySdk from 'indy-sdk'

import {
  Agent,
  ConnectionInvitationMessage,
  HttpOutboundTransport,
  LogLevel,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport, IndySdkPostgresStorageConfig, IndySdkPostgresWalletScheme, loadIndySdkPostgresPlugin } from '@aries-framework/node'
import path from 'path'

import { TsLogger } from './logger'
import { BCOVRIN_TEST_GENESIS } from './util'
import { AnonCredsModule, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
import { IndySdkAnonCredsRegistry, IndySdkIndyDidResolver, IndySdkModule, IndySdkIndyDidRegistrar, IndySdkPoolConfig } from '@aries-framework/indy-sdk'
import { randomUUID } from 'crypto'

export const setupAgent = async ({
  name,
  publicDidSeed,
  endpoints,
  port,
}: {
  name: string
  publicDidSeed: string
  endpoints: string[]
  port: number
}) => {
  const logger = new TsLogger(LogLevel.debug)

  const storageConfig = {
    type: 'postgres_storage',
    config: {
      url: '192.168.1.12:5432',
      wallet_scheme: IndySdkPostgresWalletScheme.DatabasePerWallet,
    },
    credentials: {
      account: 'postgres',
      password: 'Password1',
      admin_account: 'postgres',
      admin_password: 'Password1',
    },
  }

  loadIndySdkPostgresPlugin(storageConfig.config, storageConfig.credentials)

  const config: InitConfig = {
    label: name,
    endpoints: endpoints,
    walletConfig: {
      id: name,
      key: name,
      storage: storageConfig,
    },
    logger: logger,
  }

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()

  const indyNetworkConfig = {
    id: randomUUID(),
    genesisTransactions: BCOVRIN_TEST_GENESIS,
    indyNamespace: 'bcovrin',
    isProduction: false,
    connectOnStartup: true,
  } satisfies IndySdkPoolConfig

  const agent = new Agent({
    config: config,
    modules: {
      indySdk: new IndySdkModule({
        indySdk,
        networks: [
          indyNetworkConfig
        ]
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndySdkAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        resolvers: [new IndySdkIndyDidResolver()],
        registrars: [new IndySdkIndyDidRegistrar()],
      }),
      proofs: new ProofsModule({
        proofProtocols: [
          new V1ProofProtocol({
            indyProofFormat: legacyIndyProofFormat,
          }),
          // new V2ProofProtocol({
          //   proofFormats: [legacyIndyProofFormat],
          // }),
        ],
      }),
      credentials: new CredentialsModule({
        autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: legacyIndyCredentialFormat,
          }),
          // new V2CredentialProtocol({
          //   credentialFormats: [legacyIndyCredentialFormat],
          // }),
        ],
      }),
    },
    dependencies: agentDependencies,
  })

  const httpInbound = new HttpInboundTransport({
    port: port,
  })

  agent.registerInboundTransport(httpInbound)

  agent.registerOutboundTransport(new HttpOutboundTransport())

  httpInbound.app.get('/invitation', async (req, res) => {
    if (typeof req.query.d_m === 'string') {
      const invitation = await ConnectionInvitationMessage.fromUrl(req.url.replace('d_m=', 'c_i='))
      res.send(invitation.toJSON())
    }
    if (typeof req.query.c_i === 'string') {
      const invitation = await ConnectionInvitationMessage.fromUrl(req.url)
      res.send(invitation.toJSON())
    } else {
      const { outOfBandInvitation } = await agent.oob.createInvitation()

      res.send(outOfBandInvitation.toUrl({ domain: endpoints + '/invitation' }))
    }
  })

  await agent.initialize()

  return agent
}

