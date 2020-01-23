'use strict';

const Errors = require('../../../../errors');

module.exports = (table, child, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const idChild = req.params && req.params[`id_${child.nomenclature.relationship}`] ? req.params[`id_${child.nomenclature.relationship}`] : null;
        const options = {};

        if (req.query.force && req.query.force === 'true') {
            options.force = true;
        }

        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        if (!idChild) {
            throw new Errors.NotFound(`${child.nomenclature.title} not found`);
        }

        options.withOut = [table.nomenclature.relationship];

        options.where = options.where || {};
        options.where[`id_${table.nomenclature.relationship}`] = id;
        options.where.id = idChild;

        return models[child.model].getOne(options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${child.nomenclature.title} ${idChild} not found`);
            }

            // Only need Logical delete?
            if (!options.force && child.logicalDelete && child.logicalDelete.enabled) {
                const data = {
                    [table.logicalDelete.fieldName]: 0
                };

                return models[child.model].update(data, idChild, options).then(model => {
                    if (!model) {
                        throw new Errors.NotFound(`${child.nomenclature.title} ${idChild} not found`);
                    }
                    return model;
                });
            }

            // Physical Delete
            return models[child.model].destroy(idChild, options).then(model => {
                if (!model) {
                    throw new Errors.NotFound(`${child.nomenclature.title} ${idChild} not found`);
                }
                return model;
            });
        })
            .return({
                description: 'already-response',
                statusCode: 204
            });
    };
};
