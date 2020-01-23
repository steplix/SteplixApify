'use strict';

const _ = require('lodash');
const pagination = require('./helpers/pagination');

module.exports = (table, models) => {
    return (req, res) => {
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
        // Prevent circular reference.
        options.withOut = options.withOut || [];
        options.withOut.push(table.nomenclature.relationship);

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

        return models[table.model].find(options);
    };
};
