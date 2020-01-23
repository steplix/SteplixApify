'use strict';

const _ = require('lodash');
const CustomError = require('./custom');
const http = require('http-constants');
const errors = {};

class JsonErrorResponse extends CustomError {
    constructor (json, status = http.codes.INTERNAL_SERVER_ERROR, message = 'Json Error Response') {
        super(message, status);
        this.extra = json;
    }

    toJson () {
        return this.extra;
    }
}

errors.JsonErrorResponse = JsonErrorResponse;
errors.CustomError = CustomError;

_.reduce(http.codes, (errors, code, name) => {
    name = _.upperFirst(_.camelCase(name));

    const HttpErrorClass = (new Function(`
        return function ${name} (message, extra) {
            CustomError.call(this, message, ${code}, extra);
        }
    `))();

    HttpErrorClass.prototype = Object.create(CustomError.prototype);
    HttpErrorClass.prototype.constructor = HttpErrorClass;

    errors[name] = HttpErrorClass;
    return errors;
}, errors);

module.exports = errors;
