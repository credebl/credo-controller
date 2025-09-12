import type { ServerConfig } from '../utils/ServerConfig'
import type { Agent } from '@credo-ts/core'

import { CredentialEventTypes, CredentialStateChangedEvent } from '@credo-ts/didcomm'

import { sendWebSocketEvent } from './WebSocketEvents'
import { sendWebhookEvent } from './WebhookEvent'
import { OpenId4VcVerificationSessionStateChangedEvent, OpenId4VcVerifierEvents } from '@credo-ts/openid4vc'

export const openId4VcVerificationSessionEvents = async (agent: Agent, config: ServerConfig) => {
  agent.events.on(OpenId4VcVerifierEvents.VerificationSessionStateChanged, async (event: OpenId4VcVerificationSessionStateChangedEvent) => {
    const record = event.payload.verificationSession
    const body = { ...record.toJSON(), ...event.metadata }

    if (config.webhookUrl) {
      await sendWebhookEvent(config.webhookUrl + '/openid4vc-verification', body, agent.config.logger)
    }

    if (config.socketServer) {
      sendWebSocketEvent(config.socketServer, {
        ...event,
        payload: {
          ...event.payload,
          verificationRecord: body,
        },
      })
    }
  })
}
