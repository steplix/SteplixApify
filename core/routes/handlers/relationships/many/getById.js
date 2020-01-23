'use strict';

const _ = require('lodash');
const Errors = require('../../../../errors');

module.exports = (table, child, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const idChild = req.params && req.params[`id_${child.nomenclature.relationship}`] ? req.params[`id_${child.nomenclature.relationship}`] : null;
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

        if (!idChild) {
            throw new Errors.NotFound(`${child.nomenclature.title} not found`);
        }

        options.where = options.where || {};
        options.where[`id_${table.nomenclature.relationship}`] = id;
        options.where.id = idChild;

        return models[child.model].getOne(options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${child.nomenclature.title} ${idChild} not found`);
            }
            return model;
        });
    };
};
