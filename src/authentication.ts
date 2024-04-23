import type { RestAgentModules, RestMultiTenantAgentModules } from './cliAgent'
import type { TenantAgent } from '@aries-framework/tenants/build/TenantAgent'
import type { Request } from 'express'

import { Agent, LogLevel } from '@aries-framework/core'
import jwt, { decode } from 'jsonwebtoken'
import { container } from 'tsyringe'

import { AgentRole } from './enums/enum'
import { TsLogger } from './utils/logger'

// export type AgentType = Agent<RestAgentModules> | Agent<RestMultiTenantAgentModules> | TenantAgent<RestAgentModules>

let dynamicApiKey: string = 'api_key' // Initialize with a default value

export async function expressAuthentication(
  request: Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // agent?: Agent<RestMultiTenantAgentModules>
): Promise<boolean | Agent<RestAgentModules> | Agent<RestMultiTenantAgentModules> | TenantAgent<RestAgentModules>> {
  try {
    console.log('Race: Reached in Authentication')
    const logger = new TsLogger(LogLevel.info)
    const agent = container.resolve(Agent<RestMultiTenantAgentModules>)

    logger.info(`secMethod::: ${JSON.stringify(secMethod)}`)
    logger.info(`scopes::: ${JSON.stringify(scopes)}`)
    logger.info(`scopes::: ${JSON.stringify(scopes)}`)

    const routePath = request.path
    const requestMethod = request.method

    // List of paths for which authentication should be skipped
    const pathsToSkipAuthentication = [
      { path: '/url/', method: 'GET' },
      { path: '/multi-tenancy/url/', method: 'GET' },
      { path: '/agent', method: 'GET' },
    ]

    const skipAuthentication = pathsToSkipAuthentication.some(
      ({ path, method }) => routePath.includes(path) && requestMethod === method
    )

    if (skipAuthentication) {
      // Skip authentication for this route or controller
      console.log('Skipped authentication')
      // for skipped authentication there are two ways to handle
      request['agent'] = agent
      return true
    }

    const apiKeyHeader = request.headers['authorization']

    if (!apiKeyHeader) {
      return false
    }

    // add additional logic to get the token from wallet for validating the passed

    if (securityName === 'apiKey') {
      // Auth: For BW/Dedicated agent to GET their token
      if (apiKeyHeader) {
        const providedApiKey = apiKeyHeader as string

        if (providedApiKey === dynamicApiKey) {
          request['agent'] = agent
          return true
        }
      }
    }

    if (securityName === 'jwt') {
      const tenancy = agent!.modules.tenants ? true : false
      const tokenWithHeader = apiKeyHeader
      const token = tokenWithHeader.replace('Bearer ', '')
      const reqPath = request.path
      const decodedToken: jwt.JwtPayload = decode(token) as jwt.JwtPayload
      const role: AgentRole = decodedToken.role

      if (tenancy) {
        // it should be a shared agent
        if (role !== AgentRole.RestRootAgentWithTenants && role !== AgentRole.RestTenantAgent) {
          return false //'The agent is a multi-tenant agent'
        }

        if (role === AgentRole.RestTenantAgent) {
          // Logic if the token is of tenant agent
          console.log('Reached here in [expressAuthentication] in role === AgentRole.RestTenantAgent')
          if (reqPath.includes('/multi-tenant/')) {
            return false //'Tenants cannot manage tenants'
          } else {
            // Auth: tenant agent
            console.log('This is agent in tenantAgent:::::', agent)
            const tenantId: string = decodedToken.tenantId
            if (!tenantId) return false
            const tenantAgent = await getTenantAgent(agent!, tenantId)
            if (!tenantAgent) return false

            const verified = await verifyToken(tenantAgent, token)

            // Failed to verify token
            if (!verified) return false

            // Only need to registerInstance for TenantAgent.
            // return tenantAgent
            request['agent'] = tenantAgent
            console.log('This is agent in request["agent"]:::::', request['agent'])
            return true
          }
        } else if (role === AgentRole.RestRootAgentWithTenants) {
          // Auth: base wallet
          const verified = await verifyToken(agent!, token)

          // Base wallet cant access any endpoints apart from multi-tenant endpoint
          // if (!reqPath.includes('/multi-tenant/') && !reqPath.includes('/multi-tenancy/'))
          //   return 'Basewallet can only manage tenants and can`t perform other operations'
          if (!verified) return false

          // req['user'] = {agent}
          // req['user'] = { agent: agent }
          // return { req }
          console.log('verified in authentication for BW')
          request['agent'] = agent
          return true
        } else {
          return false //'Invalid Token'
        }
      } else {
        if (role !== AgentRole.RestRootAgent) {
          return false //'This is a dedicated agent'
        } else {
          // Auth: dedicated agent

          if (reqPath.includes('/multi-tenant/')) return false

          const verified = await verifyToken(agent!, token)
          if (!verified) return false

          // Can have an enum instead of 'success' string
          // req['user'] = { agent: agent }
          // return { req }
          request['agent'] = agent
          return true
        }
      }
    }
    return false
  } catch (error) {
    const logger = new TsLogger(LogLevel.error)
    if (error instanceof Error) {
      logger.error('Error in Authentication', error)
    }
    return false
  }
}

async function verifyToken(agent: Agent | TenantAgent<RestAgentModules>, token: string): Promise<boolean> {
  // try {
  const secretKey = await getSecretKey(agent)
  const verified = jwt.verify(token, secretKey)

  return verified ? true : false
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
  // return new Promise((resolve) => {
  //   agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent) => {
  //     // Some logic
  //     resolve(tenantAgent)
  //   })
  // })
  const tenantAgent = await agent.modules.tenants.getTenantAgent({ tenantId })
  return tenantAgent
}

export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey
}

export function getDynamicApiKey() {
  return dynamicApiKey
}
