import type { NextFunction, Request, Response } from 'express'

import { expressAuthentication } from './authentication' // Import your authentication function

import { Middlewares } from 'tsoa'

@Middlewares()
export class SecurityMiddleware {
  public async use(request: Request, response: Response, next: NextFunction) {
    try {
      const securityName = 'apiKey'

      // Extract route path or controller name from the request
      const routePath = request.path

      // List of paths for which authentication should be skipped
      const pathsToSkipAuthentication = ['/url/', '/multi-tenancy/url/', '/agent']

      // Check if authentication should be skipped for this route or controller
      const skipAuthentication = pathsToSkipAuthentication.some((path) => routePath.includes(path))

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
