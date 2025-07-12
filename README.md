<p align="center">
  <br />
  <img
    alt="Hyperledger Aries logo"
    src="https://raw.githubusercontent.com/hyperledger/aries-framework-javascript/aa31131825e3331dc93694bc58414d955dcb1129/images/aries-logo.png"
    height="250px"
  />
</p>
<h1 align="center"><b>Aries Framework JavaScript REST API</b></h1>
<p align="center">
  <a
    href="https://raw.githubusercontent.com/hyperledger/aries-framework-javascript-ext/main/LICENSE"
    ><img
      alt="License"
      src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"
  /></a>
  <a href="https://www.typescriptlang.org/"
    ><img
      alt="typescript"
      src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg"
  /></a>
    <a href="https://www.npmjs.com/package/@aries-framework/rest"
    ><img
      alt="@aries-framework/rest version"
      src="https://img.shields.io/npm/v/@aries-framework/rest"
  /></a>

</p>
<br />

The Aries Framework JavaScript REST API is the most convenient way for self-sovereign identity (SSI) developers to interact with SSI agents.

- ⭐ **Endpoints** to create connections, issue credentials, and request proofs.
- 💻 **CLI** that makes it super easy to start an instance of the REST API.
- 🌐 **Interoperable** with all major Aries implementations.

### Quick start

The REST API provides an OpenAPI schema that can easily be viewed using the SwaggerUI that is provided with the server. The docs can be viewed on the `/docs` endpoint (e.g. http://localhost:3000/docs).

> The OpenAPI spec is generated from the model classes used by Aries Framework JavaScript. Due to limitations in the inspection of these classes, the generated schema does not always exactly match the expected format. Keep this in mind when using this package. If you encounter any issues, feel free to open an issue.

#### Using the CLI

Using the CLI is the easiest way to get started with the REST API.

> **Note**: The preferred operating system for development and deployment is **Ubuntu LTS (20.04 or later)**.


### Clone the Repository

```sh
git clone https://github.com/credebl/credo-controller.git
cd credo-controller
```

### Run via Docker

#### Step 1: Create a Configuration File

In the root directory of the project, create a file named `my-config.json`.
You can base it on the sample located at `/samples/cliConfig.json`.

#### Example `my-config.json`:

```json
{
  "label": "My Credo Agent",
  "walletId": "my-wallet",
  "walletKey": "my-secret-key",
  "walletType": "sqlite",
  "walletUrl": "sqlite://wallet.db",
  "walletScheme": "ProfilePerWallet",
  "walletAccount": "admin",
  "walletPassword": "password",
  "walletAdminAccount": "admin",
  "walletAdminPassword": "admin-password",
  "adminPort": 3000,
  "walletConnectTimeout": 10000,
  "walletMaxConnections": 10,
  "walletIdleTimeout": 30000,
  "indyLedger": [
    {
      "genesisTransactions": "https://raw.githubusercontent.com/bcgov/von-network/main/BCovrin/genesis_test",
      "indyNamespace": "bcovrin:testnet"
    }
  ]
}
```

> Ensure `my-config.json` is placed at the root of the project directory.

> Do not commit `my-config.json` to version control. It may contain sensitive credentials.


#### Step 2: Start the Application

Run the following command from the root directory:

```sh
docker run -p 3000:3000 -v "$(pwd)/my-config.json:/app/my-config.json" ghcr.io/credebl/credo-controller:latest --config /app/my-config.json
```

This will:

* Map container port `3000` to your local machine.
* Mount the `my-config.json` configuration file into the container.
* Start the application with the specified configuration.




#### Starting Own Server

Starting your own server is more involved than using the CLI, but allows more fine-grained control over the settings and allows you to extend the REST API with custom endpoints.

You can create an agent instance and import the `startServer` method from the `rest` package. That's all you have to do.

```ts
import { startServer } from '@aries-framework/rest'
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'

// The startServer function requires an initialized agent and a port.
// An example of how to setup an agent is located in the `samples` directory.
const run = async () => {
  const agent = new Agent(
    {
      // ... AFJ Config ... //
    },
    agentDependencies
  )
  await startServer(agent, { port: 3000 })
}

// A Swagger (OpenAPI) definition is exposed on http://localhost:3000/docs
run()
```

### WebSocket & webhooks

The REST API provides the option to connect as a client and receive events emitted from your agent using WebSocket and webhooks.

You can hook into the events listener using webhooks, or connect a WebSocket client directly to the default server.

The currently supported events are:

- `Basic messages`
- `Connections`
- `Credentials`
- `Proofs`

When using the CLI, a webhook url can be specified using the `--webhook-url` config option.

When using the REST server as a library, the WebSocket server and webhook url can be configured in the `startServer` and `setupServer` methods.

```ts
// You can either call startServer() or setupServer() and pass the ServerConfig interface with a webhookUrl and/or a WebSocket server

const run = async (agent: Agent) => {
  const config = {
    port: 3000,
    webhookUrl: 'http://test.com',
    socketServer: new Server({ port: 8080 }),
  }
  await startServer(agent, config)
}
run()
```

The `startServer` method will create and start a WebSocket server on the default http port if no socketServer is provided, and will use the provided socketServer if available.

However, the `setupServer` method does not automatically create a socketServer, if one is not provided in the config options.

In case of an event, we will send the event to the webhookUrl with the topic of the event added to the url (http://test.com/{topic}).

So in this case when a connection event is triggered, it will be sent to: http://test.com/connections

The payload of the webhook contains the serialized record related to the topic of the event. For the `connections` topic this will be a `ConnectionRecord`, for the `credentials` topic it will be a `CredentialRecord`, and so on.

For the WebSocket clients, the events are sent as JSON stringified objects
