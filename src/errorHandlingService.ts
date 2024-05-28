import type { BaseError } from './errors/errors'

import {
  AnonCredsError,
  CredoError,
  RecordNotFoundError,
  RecordDuplicateError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from './errors/errors'
import convertError from './utils/errorConverter'

class ErrorHandlingService {
  public static handle(error: unknown): BaseError {
    if (error instanceof AnonCredsError) {
      throw this.handleAnonCredsError(error)
    } else if (error instanceof CredoError) {
      throw this.handleCredoError(error)
    } else if (error instanceof RecordNotFoundError) {
      throw this.handleRecordNotFoundError(error)
    } else if (error instanceof RecordDuplicateError) {
      throw this.handleRecordDuplicateError(error)
    } else if (error instanceof Error) {
      throw convertError(error.constructor.name, error.message)
    } else {
      throw new InternalServerError(`An unknown error occurred ${error}`)
    }
  }

  private static handleAnonCredsError(error: AnonCredsError): BaseError {
    if (error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
      throw new NotFoundError('Ledger Not Found')
    } else if (error.cause instanceof AnonCredsError) {
      if (typeof error.cause.cause === 'string') {
        switch (error.cause.cause) {
          case 'LedgerInvalidTransaction':
            throw new BadRequestError('Ledger Invalid Transaction')
          case 'CommonInvalidStructure':
            throw new BadRequestError('Common Invalid Structure')
        }
      }
    }
    throw new InternalServerError('AnonCreds Error')
  }

  private static handleCredoError(error: CredoError): BaseError {
    throw new InternalServerError(error.message)
  }

  private static handleRecordNotFoundError(error: RecordNotFoundError): BaseError {
    throw new NotFoundError(error.message)
  }

  private static handleRecordDuplicateError(error: RecordDuplicateError): BaseError {
    throw new BadRequestError(error.message)
  }
}

export default ErrorHandlingService
