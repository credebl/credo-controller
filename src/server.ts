import 'reflect-metadata'
import type { ServerConfig } from './utils/ServerConfig'
import type { Response as ExResponse, Request as ExRequest, NextFunction } from 'express'

import { Agent } from '@credo-ts/core'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import * as fs from 'fs'
import { serve, generateHTML } from 'swagger-ui-express'
import { container } from 'tsyringe'

import { setDynamicApiKey } from './authentication'
import { BaseError } from './errors/errors'
import { basicMessageEvents } from './events/BasicMessageEvents'
import { connectionEvents } from './events/ConnectionEvents'
import { credentialEvents } from './events/CredentialEvents'
import { proofEvents } from './events/ProofEvents'
import { questionAnswerEvents } from './events/QuestionAnswerEvents'
import { RegisterRoutes } from './routes/routes'
import { SecurityMiddleware } from './securityMiddleware'
import { maxRateLimit, windowMs } from './utils/util'

import { ValidateError } from 'tsoa'

export const setupServer = async (agent: Agent, config: ServerConfig, apiKey?: string) => {
  container.registerInstance(Agent, agent)
  fs.writeFileSync('config.json', JSON.stringify(config, null, 2))
  const app = config.app ?? express()
  if (config.cors) app.use(cors())

  if (config.socketServer || config.webhookUrl) {
    questionAnswerEvents(agent, config)
    basicMessageEvents(agent, config)
    connectionEvents(agent, config)
    credentialEvents(agent, config)
    proofEvents(agent, config)
  }

  // Use body parser to read sent json payloads
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  )

  setDynamicApiKey(apiKey ? apiKey : '')

  app.use(bodyParser.json())
  app.use('/docs', serve, async (_req: ExRequest, res: ExResponse) => {
    return res.send(generateHTML(await import('./routes/swagger.json')))
  })

  const limiter = rateLimit({
    windowMs, // 1 second
    max: maxRateLimit, // max 800 requests per second
  })

  // apply rate limiter to all requests
  app.use(limiter)

  // Note: Having used it above, redirects accordingly
  app.use((req, res, next) => {
    if (req.url == '/') {
      res.redirect('/docs')
      return
    }
    next()
  })

  const securityMiddleware = new SecurityMiddleware()
  app.use(securityMiddleware.use)
  RegisterRoutes(app)

  app.use(function errorHandler(err: unknown, req: ExRequest, res: ExResponse, next: NextFunction): ExResponse | void {
    if (err instanceof ValidateError) {
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      })
    }

    if (err instanceof BaseError) {
      return res.status(err.statusCode).json({
        message: err.message,
      })
    }
    next()
  })

  return app
}
