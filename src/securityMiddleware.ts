import type * as express from 'express'
import type { NextFunction } from 'express'

// eslint-disable-next-line import/order
// eslint-disable-next-line import/order
import { Middlewares } from '@tsoa/runtime'

// eslint-disable-next-line import/namespace

@Middlewares()
export class SecurityMiddleware {
  // public async use(request: express.Request, response: express.Response, next: NextFunction) {
  //   console.log('Race: Reached in Middleware')
  //   // public async use(request: express.Request, response: express.Response) {
  //   // try {

  //   const agent = container.resolve(Agent<RestMultiTenantAgentModules>)
  //   let securityName = 'jwt'

  //   // Extract route path or controller name from the request
  //   const routePath = request.path
  //   const requestMethod = request.method

  //   // List of paths for which authentication should be skipped
  //   const pathsToSkipAuthentication = [
  //     { path: '/url/', method: 'GET' },
  //     { path: '/multi-tenancy/url/', method: 'GET' },
  //     { path: '/agent', method: 'GET' },
  //   ]

  //   // Check if authentication should be skipped for this route or controller
  //   const skipAuthentication = pathsToSkipAuthentication.some(
  //     ({ path, method }) => routePath.includes(path) && requestMethod === method
  //   )
  //   // Krish: here test endpoints will be replaced by all enpoints except 'pathsToSkipAuthentication'
  //   if (routePath.includes('/agent/token')) {
  //     securityName = 'apiKey'
  //     console.log('Reached in securityMiddleware::::: /test-endpoint/')
  //     // const result = await expressAuthentication(request, securityName);
  //   }

  //   if (skipAuthentication) {
  //     // Skip authentication for this route or controller
  //     console.log('Skipped authentication')
  //     // for skipped authentication there are two ways to handle
  //     request['agent'] = agent
  //     next()
  //     // const agent = container.resolve(Agent<RestMultiTenantAgentModules>)
  //     // return Promise.resolve({ agent: agent })
  //   } else if (securityName) {
  //     const result = await expressAuthentication(request, securityName, undefined, undefined, agent)
  //     console.log('Result:::::', result)
  //     if (typeof result === 'boolean') {
  //       console.log('Successfully resulted')
  //       if (result) {
  //         // Auth: for BW/Dedicated agent
  //         // Validation for api-key
  //         // request.user = { agent: agent }
  //         request['agent'] = agent
  //         next()
  //       } else response.status(401).json({ message: `Unauthorized` })
  //       // } else return Promise.reject(new StatusException('Unauthorized', 401))
  //     } else if (!result) {
  //       response.status(401).json({ message: `Unauthorized` })
  //       // return Promise.reject(new StatusException('Unauthorized', 401))
  //     } else if (result.wallet) {
  //       console.log('this is type of result', result)
  //       console.log('From securityMiddleware:::::::::')
  //       // return Promise.resolve({ agent: result })
  //       // return result
  //       // const temp = request.user
  //       // temp['agent'] = result
  //       // request.user = temp
  //       request['agent'] = result
  //       // request.user['agent'] = result
  //       console.log('verified agent from middleware')
  //       console.log('this is request in middleware::::::', request)
  //       console.log(`this is request.agent`, request.agent)
  //       // console.log(`this is request.user.agent`, request.user)
  //       console.log(`this is request.agent.config`, request.agent.config)
  //       next()
  //     }
  //   } else {
  //     response.status(400).json({ message: 'Bad Request' })
  //     // return Promise.reject(new StatusException('Bad Request', 400))
  //   }
  //   // } catch (error) {
  //   //   next(error)
  //   // }
  // }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async use(request: express.Request, response: express.Response, next: NextFunction) {
    // Do nothing
    next()
  }
}
