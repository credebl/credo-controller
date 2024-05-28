class BaseError extends Error {
  public statusCode: number

  public constructor(message: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

class InternalServerError extends BaseError {
  public constructor(message: string = 'Internal Server Error') {
    super(message, 500)
  }
}

class NotFoundError extends BaseError {
  public constructor(message: string = 'Not Found') {
    super(message, 404)
  }
}

class BadRequestError extends BaseError {
  public constructor(message: string = 'Bad Request') {
    super(message, 400)
  }
}

class UnauthorizedError extends BaseError {
  public constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

class ForbiddenError extends BaseError {
  public constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

class ConflictError extends BaseError {
  public constructor(message: string = 'Conflict') {
    super(message, 409)
  }
}

class UnprocessableEntityError extends BaseError {
  public constructor(message: string = 'Unprocessable Entity') {
    super(message, 422)
  }
}

class LedgerNotFoundError extends NotFoundError {
  public constructor(message: string = 'Ledger Not Found') {
    super(message)
  }
}

class LedgerInvalidTransactionError extends BadRequestError {
  public constructor(message: string = 'Ledger Invalid Transaction') {
    super(message)
  }
}

class CommonInvalidStructureError extends BadRequestError {
  public constructor(message: string = 'Common Invalid Structure') {
    super(message)
  }
}

class CredoError extends InternalServerError {
  public constructor(message: string = 'CredoError') {
    super(message)
  }
}

class RecordNotFoundError extends NotFoundError {
  public constructor(message: string = 'RecordNotFoundError') {
    super(message)
  }
}

class RecordDuplicateError extends ConflictError {
  public constructor(message: string = 'RecordDuplicateError') {
    super(message)
  }
}
class AnonCredsError extends InternalServerError {
  public cause: typeof AnonCredsError | undefined
  public constructor(message: string = 'AnonCreds Error') {
    super(message)
  }
}

const errorMap: Record<string, new (message: string) => BaseError> = {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  LedgerNotFoundError,
  LedgerInvalidTransactionError,
  CommonInvalidStructureError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  CredoError,
  RecordNotFoundError,
  RecordDuplicateError,
  UnprocessableEntityError,
  AnonCredsError,
}

export {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  LedgerNotFoundError,
  LedgerInvalidTransactionError,
  CommonInvalidStructureError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BaseError,
  CredoError,
  RecordNotFoundError,
  RecordDuplicateError,
  UnprocessableEntityError,
  AnonCredsError,
  errorMap,
}
