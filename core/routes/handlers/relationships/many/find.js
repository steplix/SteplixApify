'use strict';

const _ = require('lodash');
const pagination = require('../../helpers/pagination');
const { Errors } = require('steplix-http-exception');

module.exports = (table, child, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const query = pagination(req.query = req.query || {});
        const options = {};

        if (query.limit) {
            options.limit = query.limit;
            options.offset = query.offset;
        }

        if (req.query.tiny) {
            options.tiny = true;
        }

        if (req.query.raw) {
            options.raw = true;
        }

        if (req.query.withOut) {
            options.withOut = _.map(req.query.withOut.split(','), _.trim);
        }

        options.withOut = options.withOut || [];
        if (!options.withOut.includes(table.nomenclature.relationship)) {
            options.withOut.push(table.nomenclature.relationship);
        }

        if (req.query.fields) {
            options.fields = _.map(req.query.fields.split(','), _.trim);
        }

        if (req.query.where) {
            options.where = _.reduce(req.query.where.split(','), (memo, condition) => {
                const c = condition.split('=');

                memo[c[0]] = c[1];
                return memo;
            }, {});
        }

        if (req.query.order) {
            options.order = _.map(req.query.order.split(','), condition => condition.split('-'));
        }

        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        options.where = options.where || {};
        options.where[`id_${table.nomenclature.relationship}`] = id;

        return models[child.model].find(options);
    };
};
