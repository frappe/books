const frappe = require('frappejs');

class BaseError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'BaseError';
    this.statusCode = statusCode;
    this.message = message;
  }
}

class ValidationError extends BaseError {
  constructor(message) {
    super(417, message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends BaseError {
  constructor(message) {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

class ForbiddenError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

class DuplicateEntryError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'DuplicateEntryError';
  }
}

class LinkValidationError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'LinkValidationError';
  }
}

class MandatoryError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'MandatoryError';
  }
}

class DatabaseError extends BaseError {
  constructor(message) {
    super(500, message);
    this.name = 'DatabaseError';
  }
}

class CannotCommitError extends DatabaseError {
  constructor(message) {
    super(message);
    this.name = 'CannotCommitError';
  }
}

class ValueError extends ValidationError {}
class Conflict extends ValidationError {}
class InvalidFieldError extends ValidationError {}

function throwError(message, error = 'ValidationError') {
  const errorClass = {
    ValidationError: ValidationError,
    NotFoundError: NotFoundError,
    ForbiddenError: ForbiddenError,
    ValueError: ValueError,
    Conflict: Conflict
  };
  const err = new errorClass[error](message);
  frappe.events.trigger('throw', { message, stackTrace: err.stack });
  throw err;
}

frappe.throw = throwError;

module.exports = {
  BaseError,
  ValidationError,
  ValueError,
  Conflict,
  NotFoundError,
  ForbiddenError,
  DuplicateEntryError,
  LinkValidationError,
  DatabaseError,
  CannotCommitError,
  MandatoryError,
  InvalidFieldError,
  throw: throwError
};
