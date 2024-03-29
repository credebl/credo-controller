import type * as express from 'express'
import type { NextFunction } from 'express'

import { Middlewares } from '@tsoa/runtime'

// eslint-disable-next-line import/namespace
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

      if (routePath.includes('/multi-tenant/')) {
        securityName = 'RootAuthorization'
        // const result = await expressAuthentication(request, securityName);
      }

      if (skipAuthentication) {
        // Skip authentication for this route or controller
        next()
      } else if (securityName) {
        const result = await expressAuthentication(request, securityName)

        if (result === 'success') {
          next()
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
