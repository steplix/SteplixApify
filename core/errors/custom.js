'use strict';

const Http = require('http-constants');

class CustomError extends Error {
    constructor (message, code = Http.codes.INTERNAL_SERVER_ERROR, extra = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.extra = extra;
        Error.captureStackTrace(this, this.constructor);
    }

    toJson () {
        const json = {
            error: this.message,
            code: this.code
        };

        if (this.extra) {
            json.extra = this.extra;
        }
        return json;
    }
}

module.exports = CustomError;
