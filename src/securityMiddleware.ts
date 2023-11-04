import * as express from 'express';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { Middlewares } from '@tsoa/runtime';
import { expressAuthentication } from './authentication'; // Import your authentication function

@Middlewares()
export class SecurityMiddleware {
  async use(
    request: express.Request,
    response: express.Response,
    next: NextFunction
  ) {
    try {
      const securityName = 'apiKey'; 

      if (securityName) {
        const result = await expressAuthentication(request, securityName);

        if (result === 'success') {
          next();
        } else {
          response.status(401).json({ message: 'Unauthorized' });
        }
      } else {
        response.status(400).json({ message: 'Bad Request' });
      }
    } catch (error) {
      next(error);
    }
  }
}
