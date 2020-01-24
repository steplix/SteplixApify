'use strict';

const _ = require('lodash');
const P = require('bluebird');
const pluralize = require('pluralize');
const { Errors } = require('steplix-http-exception');

module.exports = (table, models) => {
    return (req, res) => {
        const data = req.body;
        const options = {};

        req.query = req.query || {};

        if (req.query.raw) {
            options.raw = true;
        }

        return P.resolve()
            .then(() => create(data, options))
            .then(model => createMany(model, data, options))
            .then(model => validate(model.id, options));
    };

    function validate (id, options) {
        if (!id) {
            throw new Errors.NotFound(`${table.nomenclature.title} not found`);
        }

        return models[table.model].getById(id, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${table.nomenclature.title} ${id} not found`);
            }
            return model;
        });
    }

    function create (data, options) {
        if (!_.isEmpty(table.relationships.many)) {
            _.each(table.relationships.many, child => {
                data = _.omit(data, [child.replace(`${table.nomenclature.relationship}_`, '')]);
            });
        }
        if (!_.isEmpty(table.relationships.one)) {
            _.each(table.relationships.one, child => {
                data = _.omit(data, [child.replace(`${table.nomenclature.relationship}_`, '')]);
            });
        }

        return models[table.model].create(data, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${table.nomenclature.title} not found`);
            }
            return model;
        });
    }

    function createMany (model, data, options) {
        if (_.isEmpty(table.relationships.many)) {
            return model;
        }

        return P.each(table.relationships.many, child => {
            const relationship = pluralize.singular(child);
            const property = child.replace(`${table.nomenclature.relationship}_`, '');

            if (!data[property] || _.isEmpty(data[property])) {
                return P.resolve(model);
            }

            const childModel = models[_.upperFirst(_.camelCase(child))];

            return P.each(data[property], childData => {
                // Check if need create or create relationship.
                childData[`id_${table.nomenclature.relationship}`] = model.id;

                return childModel.create(childData, options).then(model => {
                    if (!model) {
                        throw new Errors.NotFound(`${_.startCase(relationship)} ${model.id} not found`);
                    }
                    return model;
                });
            });
        })
            .return(model);
    }
};
