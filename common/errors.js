class BaseError extends Error {
    constructor(status_code, ...params) {
        super(...params);
        this.status_code = status_code;
    }
}

class ValidationError extends BaseError {
    constructor(...params) { super(417, ...params); }
}

module.exports = {
    ValidationError: ValidationError,
    ValueError: class ValueError extends ValidationError { },
    Conflict: class Conflict extends ValidationError { },
    NotFound: class NotFound extends BaseError {
        constructor(...params) { super(404, ...params); }
    },
    Forbidden: class Forbidden extends BaseError {
        constructor(...params) { super(403, ...params); }
    },
}
