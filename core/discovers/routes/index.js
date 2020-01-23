'use strict';

require('colors');

const _ = require('lodash');
const P = require('bluebird');
const http = require('http-constants');
const async = require('async');
const pluralize = require('pluralize');
const Route = require('../../routes/route');
const handlers = require('../../routes/handlers');
const { filterMatches, debug } = require('../../helpers');

const defaultOptions = {
    routes: {
        models: modelName => !modelName.includes('_')
    }
};

class Discoverer {
    constructor (options) {
        this.options = _.defaultsDeep({}, options || {}, defaultOptions);
        this.scheme = this.options.scheme;
        this.data = {};

        if (!this.scheme) {
            throw new Error('Routes discoverer need options.scheme result of steplix-apify/discovers/database for work');
        }
    }

    discover () {
        return P.bind(this)
            .then(this.routes);
    }

    routes () {
        this.data.routes = {};

        return P.bind(this)
            .then(models => _.filter(_.map(this.scheme.tables, 'name'), this.options.routes.models))
            .then(models => filterMatches(models, this.options.models))
            .then(models => {
                if (debug.enabled) debug(`${models.length} models discovered.`);

                return new P((resolve, reject) => {
                    async.eachSeries(models, (model, next) => {
                        return this.route(this.scheme.tables[model])
                            .then(routes => {
                                if (debug.enabled) this.log(this.scheme.tables[model]);

                                _.extend(this.data.routes, routes);
                                return next();
                            })
                            .catch(next);
                    }, error => {
                        if (error) return reject(error);
                        return resolve();
                    });
                });
            })
            .return(this.data.routes);
    }

    route (table) {
        const routes = {};
        let url;

        table.nomenclature.route = table.nomenclature.route || _.camelCase(table.name);

        // 00 - Post for 1:N relationships like /users with /user_attributes (GET /user/:id/attributes)
        if (!_.isEmpty(table.relationships.many)) {
            _.each(table.relationships.many, child => {
                _.extend(this.data.routes, this.routesRelationshipMany(table, this.scheme.tables[child]));
            });
        }
        if (!_.isEmpty(table.relationships.one)) {
            _.each(table.relationships.one, child => {
                _.extend(this.data.routes, this.routesRelationshipOne(table, this.scheme.tables[child], child));
            });
        }

        // 01 - (find) GET /users
        url = `/${table.nomenclature.route}`;
        routes[`${url}_${http.methods.GET}`] = new Route({
            method: http.methods.GET,
            handler: handlers.find(table, this.scheme.models),
            url
        });

        // 02 - (create) POST /users
        url = `/${table.nomenclature.route}`;
        routes[`${url}_${http.methods.POST}`] = new Route({
            method: http.methods.POST,
            handler: handlers.create(table, this.scheme.models),
            url
        });

        // 03 - (get by id) GET /users/:id
        url = `/${table.nomenclature.route}/:id`;
        routes[`${url}_${http.methods.GET}`] = new Route({
            method: http.methods.GET,
            handler: handlers.getById(table, this.scheme.models),
            url
        });

        // 04 - (update) PUT /users/:id
        url = `/${table.nomenclature.route}/:id`;
        routes[`${url}_${http.methods.PUT}`] = new Route({
            method: http.methods.PUT,
            handler: handlers.update(table, this.scheme.models),
            url
        });

        // 05 - (destroy) DELETE /users/:id
        url = `/${table.nomenclature.route}/:id`;
        routes[`${url}_${http.methods.DELETE}`] = new Route({
            method: http.methods.DELETE,
            handler: handlers.destroy(table, this.scheme.models),
            url
        });

        return P.resolve(routes);
    }

    routesRelationshipMany (table, child) {
        const routes = {};
        let url;

        child.nomenclature.route = child.nomenclature.route || _.camelCase(child.name.replace(pluralize.singular(table.name), ''));

        // 01 - (find) GET /users/:id/devices
        url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}`;
        routes[`${url}_${http.methods.GET}`] = new Route({
            method: http.methods.GET,
            handler: handlers.relationships.many.find(table, child, this.scheme.models),
            url
        });

        // 02 - (create) POST /users/:id/devices
        url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}`;
        routes[`${url}_${http.methods.POST}`] = new Route({
            method: http.methods.POST,
            handler: handlers.relationships.many.create(table, child, this.scheme.models),
            url
        });

        // 03 - (get by id) GET /users/:id/devices/:id_device
        url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        routes[`${url}_${http.methods.GET}`] = new Route({
            method: http.methods.GET,
            handler: handlers.relationships.many.getById(table, child, this.scheme.models),
            url
        });

        // 04 - (update) PUT /users/:id/devices/:id_device
        url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        routes[`${url}_${http.methods.PUT}`] = new Route({
            method: http.methods.PUT,
            handler: handlers.relationships.many.update(table, child, this.scheme.models),
            url
        });

        // 05 - (destroy) DELETE /users/:id/devices/:id_device
        url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        routes[`${url}_${http.methods.DELETE}`] = new Route({
            method: http.methods.DELETE,
            handler: handlers.relationships.many.destroy(table, child, this.scheme.models),
            url
        });
        return routes;
    }

    routesRelationshipOne (table, child, name) {
        const routes = {};

        child.nomenclature.route = child.nomenclature.route || _.camelCase(child.name.replace(pluralize.singular(table.name), ''));

        // 01 - (find) GET /users/:id/devices
        const url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}`;
        routes[`${url}_${http.methods.GET}`] = new Route({
            method: http.methods.GET,
            handler: handlers.relationships.one.getOne(table, child, this.scheme.models),
            url
        });

        // TODO Implement this functionality.

        // // 02 - (create) POST /users/:id/devices
        // url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}`;
        // routes[`${url}_${http.methods.POST}`] = new Route({
        //     method: http.methods.POST,
        //     handler: handlers.relationships.one.create(table, child, this.scheme.models),
        //     url
        // });

        // // 03 - (get by id) GET /users/:id/devices/:id_device
        // url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        // routes[`${url}_${http.methods.GET}`] = new Route({
        //     method: http.methods.GET,
        //     handler: handlers.relationships.one.getById(table, child, this.scheme.models),
        //     url
        // });

        // // 04 - (update) PUT /users/:id/devices/:id_device
        // url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        // routes[`${url}_${http.methods.PUT}`] = new Route({
        //     method: http.methods.PUT,
        //     handler: handlers.relationships.one.update(table, child, this.scheme.models),
        //     url
        // });

        // // 05 - (destroy) DELETE /users/:id/devices/:id_device
        // url = `/${table.nomenclature.route}/:id/${child.nomenclature.route}/:id_${child.nomenclature.relationship}`;
        // routes[`${url}_${http.methods.DELETE}`] = new Route({
        //     method: http.methods.DELETE,
        //     handler: handlers.relationships.one.destroy(table, child, this.scheme.models),
        //     url
        // });
        return routes;
    }

    log (table) {
        const hasRelationships = table.relationships.one || table.relationships.many;

        debug(`${'✔'.green} Model ${table.model.green} discovered.`);

        if (table.logicalDelete && table.logicalDelete.enabled) {
            debug(`  |->  Logical delete enabled. Mapping with field ${table.logicalDelete.fieldName.green}`);
        }

        if (hasRelationships) {
            debug('  |->  Relationships:');
        }
        if (table.relationships.one) {
            _.each(table.relationships.one, child => {
                debug(`       |-->  Has 1 dependency with ${child.green}`);
            });
        }
        if (table.relationships.many) {
            _.each(table.relationships.many, child => {
                debug(`       |-->  Has many dependencies with ${child.green}`);
            });
        }
    }
}

module.exports = Discoverer;
