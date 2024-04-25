import { AnonCredsError, AnonCredsStoreRecordError } from '@credo-ts/anoncreds'
import {
  ClassValidationError,
  CredoError,
  MessageSendingError,
  RecordDuplicateError,
  RecordNotFoundError,
} from '@credo-ts/core'
import { IndyVdrError } from '@hyperledger/indy-vdr-nodejs'

export function handleKnownErrors(error: any, responses: any, reason?: any) {
  switch (true) {
    case error instanceof CredoError:
      return responses.internalServerError(500, { reason: reason ? reason : error?.message })
    case error instanceof RecordNotFoundError:
      return responses.notFoundError(404, { reason: reason ? reason : error?.message })
    case error instanceof RecordDuplicateError || error instanceof ClassValidationError:
      return responses.badRequestError(400, { reason: reason ? reason : error?.message })
    case error instanceof MessageSendingError ||
      error instanceof AnonCredsStoreRecordError ||
      error instanceof IndyVdrError:
      return responses.internalServerError(500, { reason: reason ? reason : error?.message })
    case error instanceof AnonCredsError:
      return responses.internalServerError(500, { reason: reason ? reason : error?.message })
    default:
      return responses.internalServerError(500, { reason: `something went wrong: ${error}` })
  }
}
