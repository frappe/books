export class BaseError extends Error {
  message: string;
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'BaseError';
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(417, message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string) {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class DuplicateEntryError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEntryError';
  }
}

export class LinkValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'LinkValidationError';
  }
}

export class MandatoryError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'MandatoryError';
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(500, message);
    this.name = 'DatabaseError';
  }
}

export class CannotCommitError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.name = 'CannotCommitError';
  }
}

export class ValueError extends ValidationError {}
export class ConflictError extends ValidationError {}
export class InvalidFieldError extends ValidationError {}
