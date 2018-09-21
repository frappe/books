const frappe = require('frappejs');

class BaseError extends Error {
    constructor(statusCode, ...params) {
        super(...params);
        this.statusCode = statusCode;
    }
}

class ValidationError extends BaseError {
    constructor(...params) {
        super(417, ...params);
    }
}

class NotFound extends BaseError {
    constructor(...params) {
        super(404, ...params);
    }
}

class Forbidden extends BaseError {
    constructor(...params) {
        super(403, ...params);
    }
}

class ValueError extends ValidationError { }
class Conflict extends ValidationError { }

function throwError(message, error='ValidationError') {
    const errorClass = {
        'ValidationError': ValidationError,
        'NotFound': NotFound,
        'Forbidden': Forbidden,
        'ValueError': ValueError,
        'Conflict': Conflict
    };
    const err = new errorClass[error](message);
    frappe.events.trigger('throw', { message, stackTrace: err.stack });
    throw err;
}

frappe.throw = throwError;

module.exports = {
    ValidationError,
    ValueError,
    Conflict,
    NotFound,
    Forbidden,
    throw: throwError
}
