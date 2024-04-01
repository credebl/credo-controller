import type { RestAgentModules, RestMultiTenantAgentModules } from './cliAgent'
import type * as express from 'express'

// import { Agent } from '@aries-framework/core'
// eslint-disable-next-line import/namespace
import type { Request } from 'express'

import { Agent, LogLevel } from '@aries-framework/core'
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent'
import jwt, { decode } from 'jsonwebtoken'
import { container } from 'tsyringe'

import { AgentType } from './enums/enum'
import { TsLogger } from './utils/logger'

export type RequestWithAgent = RequestWithRootAgent | RequestWithTenantAgent | RequestWithRootTenantAgent

export type RequestWithTenantAgent = Request & {
  user: {
    agent: TenantAgent<RestAgentModules>
  }
}

export type RequestWithRootAgent = Request & {
  user: {
    agent: Agent<RestAgentModules>
  }
}

export type RequestWithRootTenantAgent = Request & {
  user: {
    agent: Agent<RestMultiTenantAgentModules>
  }
}

let dynamicApiKey: string = 'api_key' // Initialize with a default value

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
) {
  try {
    const logger = new TsLogger(LogLevel.info)

    logger.info(`secMethod::: ${JSON.stringify(secMethod)}`)
    logger.info(`scopes::: ${JSON.stringify(scopes)}`)

    const apiKeyHeader = request.headers['authorization']

    if (!apiKeyHeader) {
      return false
    }

    // add additional logic to get the token from wallet for validating the passed

    if (securityName === 'apiKey') {
      if (apiKeyHeader) {
        const providedApiKey = apiKeyHeader as string

        if (providedApiKey === dynamicApiKey) {
          return 'success'
        }
      }
    }

    if (securityName === 'jwt') {
      const tenancy = true
      const tokenWithHeader = apiKeyHeader
      console.log(`This is tokenWithHeader:::${tokenWithHeader}`)
      const token = tokenWithHeader.replace('Bearer ', '')
      console.log(`This is token:::${token}`)
      const reqPath = request.path
      console.log(`This is reqPath:::${reqPath}`)
      const decodedToken: jwt.JwtPayload = decode(token) as jwt.JwtPayload
      const role: AgentType = decodedToken.role
      // Shound not contain any
      // const rootAgent = container.resolve(Agent)
      // Krish: figure out how can we get token from agent's generic records
      // const secretKey = this.agent

      if (tenancy) {
        const rootAgent = container.resolve(Agent<RestMultiTenantAgentModules>)
        // it should be a shared agent
        if (role !== AgentType.AgentWithTenant && role !== AgentType.TenantAgent) {
          return 'The agent is a multi-tenant agent'
        }

        if (role === AgentType.TenantAgent) {
          // Logic if the token is of tenant agent
          console.log('Middleware: Authentication: TenantAgent. The token is::', token)
          if (reqPath.includes('/multi-tenant/')) {
            return `Tenants can't manage tenants`
          } else {
            // verify tenant agent
            const tenantId: string = decodedToken.tenantId
            // const tenantAgent = await rootAgent.modules.tenants.getTenantAgent({
            //   tenantId,
            // })
            const tenantAgent: TenantAgent<RestAgentModules> = await getTenantAgent(rootAgent, tenantId)
            // console.log('Log from console, tenantAgent1::::', tenantAgent1)
            // console.log('Log from console, tenantAgent::::', tenantAgent)
            if (!tenantAgent) return

            const secretKey = await getSecretKey(tenantAgent)
            console.log('This is the secretkey for tenantAgent:::::', secretKey)
            const verified = jwt.verify(token, secretKey)
            console.log('This is the verified for tenantAgent:::::', verified)

            // Failed to verify token
            if (!verified) return

            // Only need to registerInstance for TenantAgent.
            // As Instance of RootAgent with and without tenant will already be registered while starting the server
            container.registerInstance(TenantAgent<RestAgentModules>, tenantAgent)
            return 'success'
          }
        } else if (role === AgentType.AgentWithTenant) {
          // Logic for base wallet verification
          const verified = await verifyToken(rootAgent, token)

          console.log('Middleware: Authentication: Basewallet. The token is::', token)
          console.log('The verified is::', verified)
          if (!verified) return

          return 'success'
        } else {
          return 'Invalid Token'
        }
      } else {
        const rootAgent = container.resolve(Agent<RestAgentModules>)
        // it should be a dedicated agent
        if (role !== AgentType.AgentWithoutTenant) {
          return 'This is a dedicated agent'
        } else {
          // It has a role of dedicated agent
          // Verify dedicated agent
          const verified = await verifyToken(rootAgent, token)

          console.log('Reached here. The token is::', token)
          console.log('The verified is::', verified)
          if (!verified) return

          // Can have an enum instead of 'success' string
          // return RESULT.SUCCESS
          return 'success'
        }
      }

      // if (role === AgentType.AgentWithoutTenant) {
      //   if (tenancy === true) {
      //     return false
      //   }
      // }

      // if (role === AgentType.AgentWithTenant) {
      //   if (tenancy === false) {
      //     return false
      //   }
      // else {
      //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
      //   const agent: Agent<RestMultiTenantAgentModules>
      //   const genericRecord = await agent.genericRecords.getAll()
      //   const recordWithToken = genericRecord.find((record) => record?.content?.token !== undefined)
      //   token = recordWithToken?.content.token as string
      //   return 'success'
      // }
      // }

      // const verified = jwt.verify(token, )
    }
  } catch (error) {
    const logger = new TsLogger(LogLevel.error)
    if (error instanceof Error) {
      logger.error('Error in Authentication', error)
    }
  }
}

async function verifyToken(agent: Agent, token: string): Promise<boolean> {
  // try {
  const secretKey = await getSecretKey(agent)
  const verified = jwt.verify(token, secretKey)

  return verified ? true : false
  // } catch (error) {
  //   if (error instanceof Error) {
  //     logger.error('Token Invalid')
  //   }
  // }
}

// Common function to pass agent object and get secretKey
async function getSecretKey(
  agent: Agent<RestMultiTenantAgentModules | RestAgentModules> | TenantAgent<RestAgentModules>
): Promise<string> {
  const genericRecord = await agent.genericRecords.getAll()
  const recordWithToken = genericRecord.find((record) => record?.content?.secretKey !== undefined)
  const secretKey = recordWithToken?.content.secretKey as string

  return secretKey
}

async function getTenantAgent(
  agent: Agent<RestMultiTenantAgentModules>,
  tenantId: string
): Promise<TenantAgent<RestAgentModules>> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve) => {
    agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
      // Some logic
      resolve(tenantAgent)
    })
  })
}

export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey
}

export function getDynamicApiKey() {
  return dynamicApiKey
}
