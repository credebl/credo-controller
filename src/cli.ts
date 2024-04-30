import type { InboundTransport, Transports, AriesRestConfig } from './cliAgent'

import yargs from 'yargs'

import { runRestAgent } from './cliAgent'
import { IDLE_TIMEOUT, CONNECT_TIMEOUT, MAX_CONNECTIONS } from './utils/util'

const parsed = yargs
  .command('start', 'Start AFJ Rest agent')
  .option('label', {
    alias: 'l',
    string: true,
    demandOption: true,
  })
  .option('wallet-id', {
    string: true,
    demandOption: true,
  })
  .option('wallet-key', {
    string: true,
    demandOption: true,
  })
  .option('wallet-type', {
    string: true,
    demandOption: true,
  })
  .option('wallet-url', {
    string: true,
    demandOption: true,
  })
  .option('wallet-scheme', {
    string: true,
    demandOption: true,
  })
  .option('wallet-account', {
    string: true,
    demandOption: true,
  })
  .option('wallet-password', {
    string: true,
    demandOption: true,
  })
  .option('wallet-admin-account', {
    string: true,
    demandOption: true,
  })
  .option('wallet-admin-password', {
    string: true,
    demandOption: true,
  })
  .option('indy-ledger', {
    array: true,
    default: [],
  })
  .option('endpoint', {
    array: true,
  })
  .option('log-level', {
    number: true,
    default: 3,
  })
  .option('outbound-transport', {
    default: [],
    choices: ['http', 'ws'],
    array: true,
  })
  .option('inbound-transport', {
    array: true,
    default: [],
    coerce: (input: string[]) => {
      // Configured using config object
      if (typeof input[0] === 'object') return input
      if (input.length % 2 !== 0) {
        throw new Error(
          'Inbound transport should be specified as transport port pairs (e.g. --inbound-transport http 5000 ws 5001)'
        )
      }

      return input.reduce<Array<InboundTransport>>((transports, item, index) => {
        const isEven = index % 2 === 0
        // isEven means it is the transport
        // transport port transport port
        const isTransport = isEven

        if (isTransport) {
          transports.push({
            transport: item as Transports,
            port: Number(input[index + 1]),
          })
        }

        return transports
      }, [])
    },
  })
  .option('auto-accept-connections', {
    boolean: true,
    default: false,
  })
  .option('auto-accept-credentials', {
    choices: ['always', 'never', 'contentApproved'],
    default: 'never',
  })
  .option('auto-accept-proofs', {
    choices: ['always', 'never', 'contentApproved'],
    default: 'never',
  })
  .option('webhook-url', {
    string: true,
  })
  .option('admin-port', {
    number: true,
    demandOption: true,
  })
  .option('tenancy', {
    boolean: true,
    default: false,
  })
  .option('did-registry-contract-address', {
    string: true,
  })
  .option('schema-manager-contract-address', {
    string: true,
  })
  .option('rpc-url', {
    string: true,
  })
  .option('file-server-url', {
    string: true,
  })
  .option('file-server-token', {
    string: true,
  })
  .option('wallet-connect-timeout', {
    number: true,
  })
  .option('wallet-max-connections', {
    number: true,
  })
  .option('wallet-idle-timeout', {
    number: true,
  })

  .config()
  .env('AFJ_REST')
  .parse()

const argv = yargs.argv
const storageConfig = argv['wallet-type']

// eslint-disable-next-line no-console
console.log('Storage Config after YARGS::', storageConfig)

export async function runCliServer() {
  await runRestAgent({
    label: parsed.label,
    walletConfig: {
      id: parsed['wallet-id'],
      key: parsed['wallet-key'],
      storage: {
        type: parsed['wallet-type'],
        config: {
          host: parsed['wallet-url'],
          connectTimeout: parsed['wallet-connect-timeout'] || CONNECT_TIMEOUT,
          maxConnections: parsed['wallet-max-connections'] || MAX_CONNECTIONS,
          idleTimeout: parsed['wallet-idle-timeout'] || IDLE_TIMEOUT,
        },
        credentials: {
          account: parsed['wallet-account'],
          password: parsed['wallet-password'],
          adminAccount: parsed['wallet-admin-account'],
          adminPassword: parsed['wallet-admin-password'],
        },
      },
    },
    indyLedger: parsed['indy-ledger'],
    endpoints: parsed.endpoint,
    autoAcceptConnections: parsed['auto-accept-connections'],
    autoAcceptCredentials: parsed['auto-accept-credentials'],
    autoAcceptProofs: parsed['auto-accept-proofs'],
    logLevel: parsed['log-level'],
    inboundTransports: parsed['inbound-transport'],
    outboundTransports: parsed['outbound-transport'],
    webhookUrl: parsed['webhook-url'],
    adminPort: parsed['admin-port'],
    tenancy: parsed['tenancy'],
    didRegistryContractAddress: parsed['did-registry-contract-address'],
    schemaManagerContractAddress: parsed['schema-manager-contract-address'],
    rpcUrl: parsed['rpc-url'],
    fileServerUrl: parsed['file-server-url'],
    fileServerToken: parsed['file-server-token'],
    walletScheme: parsed['wallet-scheme'],
  } as unknown as AriesRestConfig)
}
