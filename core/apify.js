'use strict';

const _ = require('lodash');
const P = require('bluebird');
const prettyMs = require('pretty-ms');
const application = require('./app');
const { Database, Routes } = require('./discovers');
const { debug } = require('./helpers');

const defaultOptions = {};

class Apify {
    constructor (options) {
        this.options = _.defaultsDeep({}, options || {}, defaultOptions);
        this.startAt = new Date().getTime();
        this.data = {};

        if (!this.options.db && !this.options.database) {
            throw new Error('Apify need options.database instance of steplix-database for work');
        }
    }

    run () {
        return P.bind(this)
            .then(this.models)
            .then(this.routes)
            .then(this.applicate)
            .spread(this.enroute);
    }

    models () {
        return (new Database(this.options)).discover();
    }

    routes (scheme) {
        return (new Routes(_.extend({}, this.options, { scheme }))).discover();
    }

    applicate (routes) {
        return [application(), routes];
    }

    enroute (app, routes) {
        _.each(routes, route => app[route.method.toLowerCase()](route.url, route.handlerize()));

        if (debug.enabled) {
            debug(`Steplix Apify discover all models and routes on ${prettyMs((new Date().getTime()) - this.startAt)}`);
        }
        return app;
    }
}

module.exports = Apify;
