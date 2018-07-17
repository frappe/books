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

module.exports = {
    ValidationError,
    ValueError,
    Conflict,
    NotFound,
    Forbidden
}
