import { t } from './translation';

export class BaseError extends Error {
  label: string;
  message: string;
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.label = t`Base Error`;
    this.name = 'BaseError';
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(417, message);
    this.label = t`Validation Error`;
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(404, message);
    this.label = t`Not Found Error`;
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string) {
    super(403, message);
    this.label = t`Forbidden Error`;
    this.name = 'ForbiddenError';
  }
}

export class DuplicateEntryError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.label = t`Duplicate Entry Error`;
    this.name = 'DuplicateEntryError';
  }
}

export class LinkValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.label = t`Link Validation Error`;
    this.name = 'LinkValidationError';
  }
}

export class MandatoryError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.label = t`Mandatory Error`;
    this.name = 'MandatoryError';
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(500, message);
    this.label = t`Database Error`;
    this.name = 'DatabaseError';
  }
}

export class CannotCommitError extends DatabaseError {
  constructor(message: string) {
    super(message);
    this.label = t`Cannot Commit Error`;
    this.name = 'CannotCommitError';
  }
}

export class ValueError extends ValidationError {}
export class ConflictError extends ValidationError {}
export class InvalidFieldError extends ValidationError {}
