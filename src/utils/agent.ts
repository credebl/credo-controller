import { CredentialsModule, DidsModule, InitConfig, ProofsModule, V2CredentialProtocol, V2ProofProtocol } from '@aries-framework/core'
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
import { IndySdkAnonCredsRegistry, IndySdkIndyDidResolver, IndySdkModule, IndySdkIndyDidRegistrar } from '@aries-framework/indy-sdk'
// import { IndyVdrAnonCredsRegistry, IndyVdrIndyDidRegistrar, IndyVdrIndyDidResolver, IndyVdrModule } from '@aries-framework/indy-vdr'
// import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
// import { AskarModule } from '@aries-framework/askar'
// import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
// import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
// import { anoncreds } from '@hyperledger/anoncreds-nodejs'
// import { CheqdModule, CheqdModuleConfig, CheqdAnonCredsRegistry, CheqdDidRegistrar, CheqdDidResolver } from '@aries-framework/cheqd'
import { TenantsModule } from '@aries-framework/tenants'

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
      url: '10.100.194.194:5432',
      wallet_scheme: IndySdkPostgresWalletScheme.DatabasePerWallet,
    },
    credentials: {
      account: 'postgres',
      password: 'Password1',
      admin_account: 'postgres',
      admin_password: 'Password1',
    },
  }

  // loadIndySdkPostgresPlugin(storageConfig.config, storageConfig.credentials)

  const config: InitConfig = {
    label: name,
    endpoints: endpoints,
    walletConfig: {
      id: name,
      key: name,
      // storage: storageConfig,
    },
    logger: logger,
  }

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()

  const agent = new Agent({
    config,
    modules: {
      indySdk: new IndySdkModule({
        indySdk,
        networks: [
          {
            id: 'Bcovrin Testnet',
            indyNamespace: 'bcovrin:test',
            isProduction: false,
            genesisTransactions: BCOVRIN_TEST_GENESIS,
            connectOnStartup: true
          },
        ]
      }),
      // indyVdr: new IndyVdrModule({
      //   indyVdr,
      //   networks: [
      //     {
      //       isProduction: false,
      //       indyNamespace: 'bcovrin:test',
      //       genesisTransactions: BCOVRIN_TEST_GENESIS,
      //       connectOnStartup: true,
      //     },
      //   ]
      // }),
      // askar: new AskarModule({
      //   ariesAskar,
      // }),

      anoncreds: new AnonCredsModule({
        registries: [new IndySdkAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        resolvers: [new IndySdkIndyDidResolver()],
        registrars: [new IndySdkIndyDidRegistrar()]
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
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: legacyIndyCredentialFormat,
          }),
          // new V2CredentialProtocol({
          //   credentialFormats: [legacyIndyCredentialFormat],
          // }),
        ],
      }),
      tenants: new TenantsModule()
    },
    dependencies: agentDependencies,
  })

  // const agent = new Agent({
  //   config,
  //   dependencies: agentDependencies,
  //   modules: {
  //     // Register the Askar module on the agent
  //     // We do this to have access to a wallet
  //     askar: new AskarModule({
  //       ariesAskar,
  //     }),
  //     anoncredsRs: new AnonCredsRsModule({
  //       anoncreds,
  //     }),
  //     indyVdr: new IndyVdrModule({
  //       indyVdr,
  //       networks: [
  //         {
  //           isProduction: false,
  //           indyNamespace: 'bcovrin:test',
  //           genesisTransactions: BCOVRIN_TEST_GENESIS,
  //           connectOnStartup: true,
  //         },
  //       ],
  //     }),
  //     cheqd: new CheqdModule(
  //       new CheqdModuleConfig({
  //         networks: [
  //           {
  //             network: 'cheqd-testnet-6',
  //             cosmosPayerSeed: 'focus install garment hungry teach kick enter inherit wheat become section shaft',
  //           },
  //         ],
  //       })
  //     ),
  //     anoncreds: new AnonCredsModule({
  //       registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry()],
  //     }),
  //     dids: new DidsModule({
  //       registrars: [new IndyVdrIndyDidRegistrar(), new CheqdDidRegistrar()],
  //       resolvers: [new IndyVdrIndyDidResolver(), new CheqdDidResolver()],
  //     }),
  //   },
  // })

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

