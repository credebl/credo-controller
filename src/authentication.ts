/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request } from 'express'

let dynamicApiKey: string = 'api_key' // Initialize with a default value

export async function expressAuthentication(
  request: Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
) {
  const apiKeyHeader = request.headers['authorization']

  if (securityName === 'apiKey') {
    if (apiKeyHeader) {
      const providedApiKey = apiKeyHeader as string

      if (providedApiKey === dynamicApiKey) {
        return 'success'
      }
    }
  }
}

export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey
}

export function getDynamicApiKey() {
  return dynamicApiKey
}
