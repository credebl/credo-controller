import 'reflect-metadata'
import type { RestAgentModules, RestMultiTenantAgentModules } from './cliAgent'
import type { ApiError } from './error'
import type { ServerConfig } from './utils/ServerConfig'
import type { Response as ExResponse, Request as ExRequest, NextFunction } from 'express'

import { Agent } from '@aries-framework/core'
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { serve, generateHTML } from 'swagger-ui-express'
import { container } from 'tsyringe'

// eslint-disable-next-line import/namespace
import { setDynamicApiKey } from './authentication'
import { ErrorMessages } from './enums/enum'
import { basicMessageEvents } from './events/BasicMessageEvents'
import { connectionEvents } from './events/ConnectionEvents'
import { credentialEvents } from './events/CredentialEvents'
import { proofEvents } from './events/ProofEvents'
import { questionAnswerEvents } from './events/QuestionAnswerEvents'
import { RegisterRoutes } from './routes/routes'
// eslint-disable-next-line import/no-cycle
import { SecurityMiddleware } from './securityMiddleware'
import { maxRateLimit, windowMs } from './utils/util'

import { ValidateError, type Exception } from 'tsoa'
// Define conditional type for Agent
// type AgentWithModules<T extends RestAgentModules> = Agent<T> & (RestMultiTenantAgentModules | RestAgentModules)

// setupServer function
export const setupServer = async (
  agent: Agent<RestMultiTenantAgentModules | RestAgentModules>,
  config: ServerConfig,
  apiKey?: string
) => {
  // export const setupServer = async (agent: Agent, config: ServerConfig, apiKey?: string) => {
  // let NewAgent: RestMultiTenantAgentModules | RestAgentModules
  // container.register(NewAgent, newAgent)
  container.registerInstance(Agent, agent as Agent)
  console.log('Reached here. This is Agent::::', agent)

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

  // Krish: there's no need to currently store apiKey
  // This will be verified based on the secretKey stored in wallet
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

  const securityMiddleware = new SecurityMiddleware()
  app.use(securityMiddleware.use)
  RegisterRoutes(app)

  // app.use(async (req, _, next) => {
  //   // End tenant session if active
  //   console.log('Ended tenant session using app.use')
  //   await endTenantSessionIfActive(req)
  //   next()
  // })

  app.use((req, res, next) => {
    if (req.url == '/') {
      res.redirect('/docs')
      return
    }
    next()
  })

  app.use(async function errorHandler(
    err: unknown,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
  ): Promise<ExResponse | void> {
    // End tenant session if active
    // console.log('Ended tenant session in [errorHandler]')
    // await endTenantSessionIfActive(req)

    if (err instanceof ValidateError) {
      agent.config.logger.warn(`Caught Validation Error for ${req.path}:`, err.fields)
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      })
    }

    if (err instanceof Error) {
      const exceptionError = err as Exception
      if (exceptionError.status === 400) {
        return res.status(400).json({
          message: `Bad Request`,
          details: err.message,
        })
      }

      if (exceptionError.status === 401) {
        return res.status(401).json({
          message: `Unauthorized`,
          details: err.message !== ErrorMessages.Unauthorized ? err.message : undefined,
        } satisfies ApiError)
      }

      agent.config.logger.error('Internal Server Error.', err)
      return res.status(500).json({
        message: 'Internal Server Error. Check server logging.',
      })
    }
    next()
  })

  app.use(function notFoundHandler(_req, res: ExResponse) {
    res.status(404).send({
      message: 'Not Found',
    })
  })

  return app
}

// async function endTenantSessionIfActive(request: ExRequest) {
//   if ('agent' in request) {
//     const agent = request?.agent
//     if (agent instanceof TenantAgent) {
//       agent.config.logger.debug('Ending tenant session')
//       await agent.endSession()
//     }
//   }
// }
