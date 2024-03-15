import type { InitConfig } from '@aries-framework/core'

import {
  AnonCredsModule,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
  AnonCredsCredentialFormatService,
  AnonCredsProofFormatService,
} from '@aries-framework/anoncreds'
import { AskarModule } from '@aries-framework/askar'
import {
  AutoAcceptCredential,
  CredentialsModule,
  DidsModule,
  JsonLdCredentialFormatService,
  KeyDidRegistrar,
  KeyDidResolver,
  PresentationExchangeProofFormatService,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
  WebDidResolver,
  Agent,
  ConnectionInvitationMessage,
  HttpOutboundTransport,
  LogLevel,
} from '@aries-framework/core'
import { IndyVdrAnonCredsRegistry, IndyVdrModule } from '@aries-framework/indy-vdr'
import { agentDependencies, HttpInboundTransport, IndySdkPostgresWalletScheme } from '@aries-framework/node'
import { TenantsModule } from '@aries-framework/tenants'
import { PolygonModule } from '@ayanworks/credo-polygon-w3c-module'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'

import { TsLogger } from './logger'
import { BCOVRIN_TEST_GENESIS } from './util'

export const setupAgent = async ({ name, endpoints, port }: { name: string; endpoints: string[]; port: number }) => {
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
      storage: storageConfig,
    },
    logger: logger,
  }

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()
  const agent = new Agent({
    config: config,
    modules: {
      indyVdr: new IndyVdrModule({
        indyVdr,
        networks: [
          {
            isProduction: false,
            indyNamespace: 'bcovrin:test',
            genesisTransactions: BCOVRIN_TEST_GENESIS,
            connectOnStartup: true,
          },
        ],
      }),
      askar: new AskarModule({
        ariesAskar,
      }),

      anoncreds: new AnonCredsModule({
        registries: [new IndyVdrAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        registrars: [new KeyDidRegistrar()],
        resolvers: [new KeyDidResolver(), new WebDidResolver()],
      }),
      proofs: new ProofsModule({
        proofProtocols: [
          new V1ProofProtocol({
            indyProofFormat: legacyIndyProofFormat,
          }),
          new V2ProofProtocol({
            proofFormats: [
              legacyIndyProofFormat,
              new AnonCredsProofFormatService(),
              new PresentationExchangeProofFormatService(),
            ],
          }),
        ],
      }),
      credentials: new CredentialsModule({
        autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: legacyIndyCredentialFormat,
          }),
          new V2CredentialProtocol({
            credentialFormats: [
              legacyIndyCredentialFormat,
              new JsonLdCredentialFormatService(),
              new AnonCredsCredentialFormatService(),
            ],
          }),
        ],
      }),
      tenants: new TenantsModule(),
      polygon: new PolygonModule({
        didContractAddress: '',
        schemaManagerContractAddress: '',
        fileServerToken: '',
        rpcUrl: '',
        serverUrl: '',
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
