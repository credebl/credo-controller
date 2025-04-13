import type { RestAgentModules } from '../cliAgent'
import type { Agent } from '@credo-ts/core'

export class ApiService {
  private fetch: typeof globalThis.fetch

  public constructor(agent: Agent<RestAgentModules>) {
    this.fetch = agent.config.agentDependencies.fetch
  }

  public async postRequest<T, R>(url: string, payload: T, token: string): Promise<R> {
    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await this.fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to make POST request. Status code: ${response.status}`)
      }

      return (await response.json()) as R
    } catch (error) {
      throw new Error(`Error making POST request: ${error}`)
    }
  }

  public async getRequest(url: string, token?: string): Promise<any> {
    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    }

    try {
      const response = await this.fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to make GET request. Status code: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      throw new Error(`Error making GET request: ${error}`)
    }
  }
  public async putRequest<T>(url: string, payload: T, token: string): Promise<any> {
    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await this.fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to make PUT request. Status code: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      throw new Error(`Error making PUT request: ${error}`)
    }
  }

  public async patchRequest<T>(url: string, payload: T, token: string): Promise<any> {
    const headers = {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await this.fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to make PATCH request. Status code: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      throw new Error(`Error making PATCH request: ${error}`)
    }
  }
}
