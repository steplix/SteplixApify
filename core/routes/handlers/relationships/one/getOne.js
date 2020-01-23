'use strict';

const _ = require('lodash');
const Errors = require('../../../../errors');

module.exports = (table, child, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const options = {};

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

        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        return models[table.model].getById(id).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${table.nomenclature.title} ${id} not found`);
            }

            const related = model[child.nomenclature.relationship.replace(`${table.nomenclature.relationship}_`, '')];

            if (!related) {
                throw new Errors.NotFound(`${child.nomenclature.title} not found on ${table.nomenclature.title} ${id}`);
            }

            return models[child.model].getById(related.id, options).then(model => {
                if (!model) {
                    throw new Errors.NotFound(`${child.nomenclature.title} ${related.id} not found`);
                }
                return model;
            });
        });
    };
};
