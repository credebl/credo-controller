import { AnonCredsError } from '@credo-ts/anoncreds'

import { COMMON_INVALID_STRUCTURE, LEDGER_INVALID_TRANSACTION, LEDGER_NOT_FOUND } from '../../errorMessages'
import { handleKnownErrors } from '../../globalExceptionHandler'

export function handleAnonCredsError(
  error: unknown,
  notFoundError: unknown,
  forbiddenError: unknown,
  badRequestError: unknown,
  internalServerError: unknown
) {
  if (error instanceof AnonCredsError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
    return handleKnownErrors(
      error,
      { notFoundError, forbiddenError, badRequestError, internalServerError },
      LEDGER_NOT_FOUND
    )
  } else if (error instanceof AnonCredsError && error.cause instanceof AnonCredsError) {
    if (error.cause && typeof error.cause.cause === 'string' && error.cause.cause === 'LedgerInvalidTransaction') {
      return handleKnownErrors(
        error,
        { notFoundError, forbiddenError, badRequestError, internalServerError },
        LEDGER_INVALID_TRANSACTION
      )
    } else if (error.cause && typeof error.cause.cause === 'string' && error.cause.cause === 'CommonInvalidStructure') {
      return handleKnownErrors(
        error,
        { notFoundError, forbiddenError, badRequestError, internalServerError },
        COMMON_INVALID_STRUCTURE
      )
    } else {
      return handleKnownErrors(error, { notFoundError, forbiddenError, badRequestError, internalServerError })
    }
  }
}
