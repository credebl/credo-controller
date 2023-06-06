import { ConnectionsModule, CredentialsModule, DidsModule, InitConfig, ProofsModule, V2CredentialProtocol, V2ProofProtocol } from '@aries-framework/core'
import indySdk from 'indy-sdk'

import {
  AutoAcceptCredential,
  AutoAcceptProof,
  Agent,
  ConnectionInvitationMessage,
  HttpOutboundTransport,
  LogLevel,
  utils,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import path from 'path'

import { TsLogger } from './logger'
import { BCOVRIN_TEST_GENESIS } from './util'
import { AnonCredsModule, LegacyIndyCredentialFormatService, LegacyIndyProofFormatService, V1CredentialProtocol, V1ProofProtocol } from '@aries-framework/anoncreds'
import { AskarModule } from '@aries-framework/askar'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { IndyVdrAnonCredsRegistry, IndyVdrIndyDidRegistrar, IndyVdrIndyDidResolver, IndyVdrModule } from '@aries-framework/indy-vdr'
import { CheqdAnonCredsRegistry, CheqdDidRegistrar, CheqdDidResolver } from '@aries-framework/cheqd'
import { IndySdkAnonCredsRegistry, IndySdkIndyDidResolver, IndySdkModule } from '@aries-framework/indy-sdk'

export const genesisPath = process.env.GENESIS_TXN_PATH
  ? path.resolve(process.env.GENESIS_TXN_PATH)
  : path.join(__dirname, '../../../../network/genesis/local-genesis.txn')

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

  const config: InitConfig = {
    label: name,
    endpoints: endpoints,
    walletConfig: { id: name, key: name },
    // connectToIndyLedgersOnStartup: false,
    // useLegacyDidSovPrefix: true,
    logger: logger,
  }

  const legacyIndyCredentialFormat = new LegacyIndyCredentialFormatService()
  const legacyIndyProofFormat = new LegacyIndyProofFormatService()

  const agent = new Agent({
    config,
    modules: {
      // indyVdr: new IndyVdrModule({
      //   indyVdr,
      //   networks: [
      //     {
      //       isProduction: false,
      //       indyNamespace: 'bcovrin:test',
      //       genesisTransactions: BCOVRIN_TEST_GENESIS,
      //       connectOnStartup: true,
      //     },
      //   ],
      // }),
      indySdk: new IndySdkModule({
        indySdk,
        networks: [
          {
            isProduction: false,
            indyNamespace: 'bcovrin:test',
            genesisTransactions: BCOVRIN_TEST_GENESIS,
            connectOnStartup: true,
          },
        ]
      }),
      anoncreds: new AnonCredsModule({
        registries: [new IndySdkAnonCredsRegistry()],
      }),
      dids: new DidsModule({
        resolvers: [new IndySdkIndyDidResolver()],
      }),
      proofs: new ProofsModule({
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
        credentialProtocols: [
          new V1CredentialProtocol({
            indyCredentialFormat: legacyIndyCredentialFormat,
          }),
          new V2CredentialProtocol({
            credentialFormats: [legacyIndyCredentialFormat],
          }),
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

