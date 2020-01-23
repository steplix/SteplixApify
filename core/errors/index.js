'use strict';

const CustomError = require('./custom');
const http = require('http-constants');

class InternalServerError extends CustomError {
    constructor (message, extra) {
        super(message, http.codes.INTERNAL_SERVER_ERROR, extra);
    }
}

class ConflictError extends CustomError {
    constructor (message, extra) {
        super(message, http.codes.CONFLICT, extra);
    }
}

class Unauthorized extends CustomError {
    constructor (message, extra) {
        super(message, http.codes.UNAUTHORIZED, extra);
    }
}

class BadRequest extends CustomError {
    constructor (message, extra) {
        super(message, http.codes.BAD_REQUEST, extra);
    }
}

class NotFound extends CustomError {
    constructor (message, extra) {
        super(message, http.codes.NOT_FOUND, extra);
    }
}

class JsonErrorResponse extends CustomError {
    constructor (json, status = http.codes.INTERNAL_SERVER_ERROR, message = 'Json Error Response') {
        super(message, status);
        this.extra = json;
    }

    toJson () {
        return this.extra;
    }
}

module.exports = {
    CannotExecuteQuery: new InternalServerError('The system cannot execute the query.'),
    Internal: new InternalServerError('Internal Server Error.'),
    InternalServerError,
    JsonErrorResponse,
    ConflictError,
    Unauthorized,
    BadRequest,
    NotFound,
    CustomError
};
