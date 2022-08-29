export class BaseError extends Error {
  more: Record<string, unknown> = {};
  message: string;
  statusCode: number;
  shouldStore: boolean;

  constructor(
    statusCode: number,
    message: string,
    shouldStore: boolean = true
  ) {
    super(message);
    this.name = 'BaseError';
    this.statusCode = statusCode;
    this.message = message;
    this.shouldStore = shouldStore;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, shouldStore: boolean = false) {
    super(417, message, shouldStore);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, shouldStore: boolean = true) {
    super(404, message, shouldStore);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string, shouldStore: boolean = true) {
    super(403, message, shouldStore);
    this.name = 'ForbiddenError';
  }
}

export class DuplicateEntryError extends ValidationError {
  constructor(message: string, shouldStore: boolean = false) {
    super(message, shouldStore);
    this.name = 'DuplicateEntryError';
  }
}

export class LinkValidationError extends ValidationError {
  constructor(message: string, shouldStore: boolean = false) {
    super(message, shouldStore);
    this.name = 'LinkValidationError';
  }
}

export class MandatoryError extends ValidationError {
  constructor(message: string, shouldStore: boolean = false) {
    super(message, shouldStore);
    this.name = 'MandatoryError';
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, shouldStore: boolean = true) {
    super(500, message, shouldStore);
    this.name = 'DatabaseError';
  }
}

export class CannotCommitError extends DatabaseError {
  constructor(message: string, shouldStore: boolean = true) {
    super(message, shouldStore);
    this.name = 'CannotCommitError';
  }
}

export class NotImplemented extends BaseError {
  constructor(message: string = '', shouldStore: boolean = false) {
    super(501, message, shouldStore);
    this.name = 'NotImplemented';
  }
}

export class ValueError extends ValidationError {}
export class ConflictError extends ValidationError {}
export class InvalidFieldError extends ValidationError {}

export function getDbError(err: Error) {
  if (!err.message) {
    return DatabaseError;
  }

  if (err.message.includes('SQLITE_ERROR: no such table')) {
    return NotFoundError;
  }

  if (err.message.includes('FOREIGN KEY')) {
    return LinkValidationError;
  }

  if (err.message.includes('SQLITE_ERROR: cannot commit')) {
    return CannotCommitError;
  }

  if (err.message.includes('UNIQUE constraint failed:')) {
    return DuplicateEntryError;
  }

  return DatabaseError;
}
