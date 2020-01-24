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

        if (req.query.withOut) {
            options.withOut = _.map(req.query.withOut.split(','), _.trim);
        }
        // Prevent circular reference.
        options.withOut = options.withOut || [];
        options.withOut.push(table.nomenclature.relationship);

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
