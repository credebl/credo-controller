import { startServer } from '@aries-framework/rest'
import { AutoAcceptCredential, LogLevel } from '@aries-framework/core'
import { setupAgent } from './utils/agent'
import { TestLogger } from './utils/logger'
import { ServerConfig } from './utils/ServerConfig'

// The startServer function requires an initialized agent and a port.
// An example of how to setup an agent is located in the `samples` directory.
const run = async () => {
  
  const logger = new TestLogger(LogLevel.debug)
  
  const port: number = 6000
  const agentName = 'Shanki'
  
  console.log(port);
  const endpoint = `http://localhost:${port}`

  const agent = await setupAgent({
    port: port,
    publicDidSeed: '000000000000000000000000Steward1',
    endpoints: [endpoint],
    name: agentName,
    logger: logger,
    autoAcceptConnection: true,
    autoAcceptCredential: AutoAcceptCredential.ContentApproved,
    useLegacyDidSovPrefix: true,
  })

  const conf: ServerConfig = {
    port: port,
    cors: true,
  }

  await startServer(agent, { port: port+1 })
}


// A Swagger (OpenAPI) definition is exposed on http://localhost:port/docs
run()