import type * as express from 'express'
import type { NextFunction } from 'express'

// eslint-disable-next-line import/order
import { Middlewares } from '@tsoa/runtime'

import { expressAuthentication } from './authentication' // Import your authentication function

@Middlewares()
export class SecurityMiddleware {
  public async use(request: express.Request, response: express.Response, next: NextFunction) {
    try {
      let securityName = 'apiKey'

      // Extract route path or controller name from the request
      const routePath = request.path

      // List of paths for which authentication should be skipped
      const pathsToSkipAuthentication = ['/url/', '/multi-tenancy/url/', '/agent']

      // Check if authentication should be skipped for this route or controller
      const skipAuthentication = pathsToSkipAuthentication.some((path) => routePath.includes(path))

      // Krish: here test endpoints will be replaced by all enpoints except 'pathsToSkipAuthentication'
      if (routePath.includes('/test-endpoint/')) {
        securityName = 'NewAuth'
        console.log('Reached in securityMiddleware::::: /test-endpoint/')
        // const result = await expressAuthentication(request, securityName);
      }

      if (skipAuthentication) {
        // Skip authentication for this route or controller
        console.log('Skipped authentication')
        next()
      } else if (securityName) {
        const result = await expressAuthentication(request, securityName)
        console.log('This is result in securityMiddleware:::::', result)

        if (result === 'success') {
          console.log('Successfully resulted')
          next()
        } else if (result) {
          response.status(401).json({ message: `Unauthorized ${result}` })
        } else {
          response.status(401).json({ message: 'Unauthorized' })
        }
      } else {
        response.status(400).json({ message: 'Bad Request' })
      }
    } catch (error) {
      next(error)
    }
  }
}
