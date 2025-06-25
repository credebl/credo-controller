import type { Logger } from '@credo-ts/core'

export const sendWebhookEvent = async (webhookUrl: string, body: Record<string, unknown>, logger: Logger) => {
  try {
    const fetch = (await import('node-fetch')).default
    await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.error(`Error sending ${body.type} webhook event to ${webhookUrl}`, {
      cause: error,
    })
  }
}
