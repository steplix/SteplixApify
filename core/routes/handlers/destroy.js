'use strict';

const { Errors } = require('steplix-http-exception');

module.exports = (table, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const options = {};
        let data;

        req.query = req.query || {};

        if (req.query.force) {
            options.force = true;
        }

        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        // Only need Logical delete?
        if (!options.force && table.logicalDelete && table.logicalDelete.enabled) {
            data = {
                [table.logicalDelete.fieldName]: 0
            };

            return models[table.model].update(data, id, options).then(model => {
                if (!model) {
                    throw new Errors.NotFound(`${table.nomenclature.title} ${id} not found`);
                }
                return {
                    description: 'already-response',
                    statusCode: 204
                };
            });
        }

        // Physical Delete
        return models[table.model].destroy(id, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${table.nomenclature.title} ${id} not found`);
            }
            return {
                description: 'already-response',
                statusCode: 204
            };
        });
    };
};
