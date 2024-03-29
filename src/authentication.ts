import type * as express from 'express'
import { AgentType } from './enums/enum'

import { Agent, LogLevel } from '@aries-framework/core'
import jwt from 'jsonwebtoken'


import { TsLogger } from './utils/logger'

let dynamicApiKey: string = 'api_key' // Initialize with a default value

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
) {
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

  if (securityName === 'RootAuthorization') {
    const tenancy = true
    const token = apiKeyHeader
    const decodedToken: jwt.JwtPayload = jwt.decode(token) as jwt.JwtPayload
    const role: AgentType = decodedToken.role
    // Krish: figure out how can we get token from agent's generic records
    // const secretKey = this.agent

    if (role === AgentType.AgentWithoutTenant && tenancy === true) {
      return false
    }

    if (role === AgentType.AgentWithTenant && tenancy === false) {
      return false
    }

    // const verified = jwt.verify(token, )
  }
}

export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey
}

export function getDynamicApiKey() {
  return dynamicApiKey
}
