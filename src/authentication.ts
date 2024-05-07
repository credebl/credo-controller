import type { RestAgentModules, RestMultiTenantAgentModules } from './cliAgent'
import type { TenantAgent } from '@aries-framework/tenants/build/TenantAgent'
import type { Request } from 'express'

import { Agent, LogLevel } from '@aries-framework/core'
import jwt, { decode } from 'jsonwebtoken'
import { container } from 'tsyringe'

import { AgentRole, ErrorMessages } from './enums/enum'
import { StatusException } from './error'
import { TsLogger } from './utils/logger'

// export type AgentType = Agent<RestAgentModules> | Agent<RestMultiTenantAgentModules> | TenantAgent<RestAgentModules>

let dynamicApiKey: string = 'api_key' // Initialize with a default value

export async function expressAuthentication(request: Request, securityName: string, scopes?: string[]) {
  const logger = new TsLogger(LogLevel.info)
  const agent = container.resolve(Agent<RestMultiTenantAgentModules>)

  logger.info(`securityName::: ${securityName}`)
  logger.info(`scopes::: ${scopes}`)

  if (scopes && scopes?.includes('skip')) {
    // Skip authentication for this route or controller
    request['agent'] = agent
    return true
  }

  const apiKeyHeader = request.headers['authorization']

  if (!apiKeyHeader) {
    // return false
    return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
  }

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
    const token = tokenWithHeader!.replace('Bearer ', '')
    const reqPath = request.path
    const decodedToken: jwt.JwtPayload = decode(token) as jwt.JwtPayload
    const role: AgentRole = decodedToken.role

    if (tenancy) {
      // it should be a shared agent
      if (role !== AgentRole.RestRootAgentWithTenants && role !== AgentRole.RestTenantAgent) {
        // return false //'The agent is a multi-tenant agent'
        logger.debug('Unknown role. The agent is a multi-tenant agent')
        return Promise.reject(new StatusException('Unknown role', 401))
      }
      if (role === AgentRole.RestTenantAgent) {
        // Logic if the token is of tenant agent
        if (reqPath.includes('/multi-tenancy/')) {
          // Note: Include the below logic for path detection instead of url
          // if (scopes && scopes?.includes('multi-tenant')) {
          logger.debug('Tenants cannot manage tenants')
          return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
        } else {
          // Auth: tenant agent
          const tenantId: string = decodedToken.tenantId
          if (!tenantId) {
            // return false
            return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
          }
          const tenantAgent = await agent.modules.tenants.getTenantAgent({ tenantId })
          if (!tenantAgent) {
            // return false
            return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
          }

          const verified = await verifyToken(tenantAgent, token)
          // Note: logic to store generate token for tenant using BW's secertKey
          // const verified = await verifyToken(agent, token)

          // Failed to verify token
          if (!verified) {
            // return false
            return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
          }

          // Only need to registerInstance for TenantAgent.
          // return tenantAgent
          request['agent'] = tenantAgent
          return true
        }
      } else if (role === AgentRole.RestRootAgentWithTenants) {
        // Auth: base wallet
        const verified = await verifyToken(agent!, token)

        // Base wallet cant access any endpoints apart from multi-tenant endpoint
        // if (!reqPath.includes('/multi-tenancy/')) {
        //   logger.error('Basewallet can only manage tenants and can`t perform other operations')
        //   return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
        // }

        // Note: Implement the authorization part using scopes(below), instead of url(above)
        // if (!scopes?.includes('multi-tenant')) {
        //   logger.error('Basewallet can only manage tenants')
        //   return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
        // }

        if (!verified) return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))

        request['agent'] = agent
        return true
      } else {
        // return false //'Invalid Token'
        logger.debug('Invalid Token')
        return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
      }
    } else {
      if (role !== AgentRole.RestRootAgent) {
        logger.debug('This is a dedicated agent')
        return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
        // return false //'This is a dedicated agent'
      } else {
        // Auth: dedicated agent

        if (reqPath.includes('/multi-tenancy/'))
          return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))

        const verified = await verifyToken(agent!, token)
        if (!verified) return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
        //return false

        request['agent'] = agent
        return true
      }
    }
  }
  // return false
  return Promise.reject(new StatusException(ErrorMessages.Unauthorized, 401))
}

async function verifyToken(agent: Agent | TenantAgent<RestAgentModules>, token: string): Promise<boolean> {
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

export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey
}

export function getDynamicApiKey() {
  return dynamicApiKey
}
