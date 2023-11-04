import * as express from "express";

let dynamicApiKey: string = 'api_key'; // Initialize with a default value

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
) {
  const apiKeyHeader = request.headers['authorization'];

  if (securityName === 'apiKey') {
    if (apiKeyHeader) {
      const providedApiKey = apiKeyHeader as string;

      if (providedApiKey === dynamicApiKey) {
        return Promise.resolve("success");
      }
    }

    throw Error("unauthorized");
  }

  return Promise.reject("Invalid securityName or secMethod not provided");
}


export function setDynamicApiKey(newApiKey: string) {
  dynamicApiKey = newApiKey;
}

export function getDynamicApiKey() {
  return dynamicApiKey;
}