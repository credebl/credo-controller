import type { RestMultiTenantAgentModules } from '../cliAgent'
import type { ServerConfig } from '../utils/ServerConfig'
import type { Agent, CredentialStateChangedEvent } from '@credo-ts/core'

import { CredentialEventTypes } from '@credo-ts/core'

import { sendWebSocketEvent } from './WebSocketEvents'
import { sendWebhookEvent } from './WebhookEvent'

export const credentialEvents = async (agent: Agent<RestMultiTenantAgentModules>, config: ServerConfig) => {
  agent.events.on(CredentialEventTypes.CredentialStateChanged, async (event: CredentialStateChangedEvent) => {
    const record = event.payload.credentialRecord

    const body: Record<string, unknown> = {
      ...record.toJSON(),
      ...event.metadata,
      outOfBandId: null,
      credentialData: null,
    }

    if (event.metadata.contextCorrelationId !== 'default') {
      await agent.modules.tenants.withTenantAgent(
        { tenantId: event.metadata.contextCorrelationId },
        async (tenantAgent) => {
          if (record?.connectionId) {
            const connectionRecord = await tenantAgent.connections.findById(record.connectionId!)
            body.outOfBandId = connectionRecord?.outOfBandId
          }
          const data = await tenantAgent.credentials.getFormatData(record.id)
          body.credentialData = data
        }
      )
    }

    if (event.metadata.contextCorrelationId === 'default') {
      if (record?.connectionId) {
        const connectionRecord = await agent.connections.findById(record.connectionId!)
        body.outOfBandId = connectionRecord?.outOfBandId
      }

      const data = await agent.credentials.getFormatData(record.id)
      body.credentialData = data
    }
    // Only send webhook if webhook url is configured
    if (config.webhookUrl) {
      await sendWebhookEvent(config.webhookUrl + '/credentials', body, agent.config.logger)
    }

    if (config.socketServer) {
      // Always emit websocket event to clients (could be 0)
      sendWebSocketEvent(config.socketServer, {
        ...event,
        payload: {
          ...event.payload,
          credentialRecord: body,
        },
      })
    }
  })
}
