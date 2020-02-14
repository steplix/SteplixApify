'use strict';

const _ = require('lodash');
const { Errors } = require('steplix-http-exception');

module.exports = (table, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const options = {};

        req.query = req.query || {};

        if (req.query.tiny) {
            options.tiny = true;
        }

        if (req.query.raw) {
            options.raw = true;
        }

        if (req.query.without) {
            options.without = _.map(req.query.without.split(','), _.trim);
        }
        // Prevent circular reference.
        options.without = options.without || [];
        options.without.push(table.nomenclature.relationship);

        if (req.query.fields) {
            options.fields = _.map(req.query.fields.split(','), _.trim);
        }

        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        return models[table.model].getById(id, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${table.nomenclature.title} ${id} not found`);
            }
            return model;
        });
    };
};
