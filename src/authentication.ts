import * as express from "express";

let dynamicApiKey: string = 'default_api_key'; // Initialize with a default value

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  secMethod?: { [key: string]: any },
  scopes?: string
) {
  if (securityName === 'apiKey') {
    const apiKeyHeader = request.headers['authorization'];

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