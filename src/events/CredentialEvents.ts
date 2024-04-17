import type { RestMultiTenantAgentModules } from '../cliAgent'
import type { ServerConfig } from '../utils/ServerConfig'
import type { Agent, CredentialStateChangedEvent } from '@credo-ts/core'

import { CredentialEventTypes } from '@credo-ts/core'

import { sendWebSocketEvent } from './WebSocketEvents'
import { sendWebhookEvent } from './WebhookEvent'

export const credentialEvents = async (agent: Agent<RestMultiTenantAgentModules>, config: ServerConfig) => {
  agent.events.on(CredentialEventTypes.CredentialStateChanged, async (event: CredentialStateChangedEvent) => {
    const record = event.payload.credentialRecord

    const body = { ...record.toJSON(), ...event.metadata } as { outOfBandId?: string }

    if (event.metadata.contextCorrelationId !== 'default' && record?.connectionId) {
      await agent.modules.tenants.withTenantAgent(
        { tenantId: event.metadata.contextCorrelationId },
        async (tenantAgent) => {
          const connectionRecord = await tenantAgent.connections.findById(record.connectionId!)
          body.outOfBandId = connectionRecord?.outOfBandId
        }
      )
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
