'use strict';

const _ = require('lodash');
const P = require('bluebird');
const { debug } = require('../helpers');

class Route {
    constructor (options) {
        this.url = options.url;
        this.method = options.method;
        this.handler = options.handler;
    }

    handle (req, res, next) {
        return P.bind(this)
            .then(() => this.validate(req, res))
            .then(() => this.handler(req, res))
            .then(result => this.success(res, result))
            .catch(error => this.error(error, req, res, next));
    }

    validate () {
        return P.resolve();
    }

    success (res, result, statusCode = 200) {
        // Handle exceptional cases
        if (result && result.statusCode && result.description === 'already-response') {
            statusCode = result.statusCode;
            result = result.response;
        }
        return res.status(statusCode).send(result);
    }

    error (err, req, res, next) {
        const code = (err && (err.statusCode || err.status || (_.isNumber(err.code) && err.code))) || 500;
        return res.status(code).send({ code, error: `${err.message}` });
    }

    handlerize () {
        if (debug.enabled) debug(`Route: ${_.padEnd(this.method, 7)} - ${this.url}`);
        return this.handle.bind(this);
    }
}

module.exports = Route;
