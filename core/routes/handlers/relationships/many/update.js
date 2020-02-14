'use strict';

const _ = require('lodash');
const P = require('bluebird');
const pluralize = require('pluralize');
const { Errors } = require('steplix-http-exception');

module.exports = (table, child, models) => {
    return (req, res) => {
        const id = req.params && req.params.id ? req.params.id : null;
        const idChild = req.params && req.params[`id_${child.nomenclature.relationship}`] ? req.params[`id_${child.nomenclature.relationship}`] : null;
        const data = req.body;
        const options = {};

        req.query = req.query || {};

        if (req.query.raw) {
            options.raw = true;
        }

        options.without = [table.nomenclature.relationship];

        return P.resolve()
            .then(() => validate(id, idChild, options))
            .then(() => update(data, idChild, options))
            .then(model => updateMany(model, data, options))
            .then(() => get(idChild, options));
    };

    function validate (id, idChild, options) {
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
    }

    function update (data, id, options) {
        if (!_.isEmpty(child.relationships.many)) {
            _.each(child.relationships.many, subchild => {
                data = _.omit(data, [subchild.replace(`${child.nomenclature.relationship}_`, '')]);
            });
        }
        if (!_.isEmpty(child.relationships.one)) {
            _.each(child.relationships.one, subchild => {
                data = _.omit(data, [subchild.replace(`${child.nomenclature.relationship}_`, '')]);
            });
        }

        return models[child.model].update(data, id, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${child.nomenclature.title} ${id} not found`);
            }
            return model;
        });
    }

    function updateMany (model, data, options) {
        if (_.isEmpty(child.relationships.many)) {
            return model;
        }

        return P.each(child.relationships.many, subchild => {
            const relationship = pluralize.singular(subchild);
            const property = subchild.replace(`${child.nomenclature.relationship}_`, '');

            if (!data[property] || _.isEmpty(data[property])) {
                return P.resolve(model);
            }

            const childModel = models[_.upperFirst(_.camelCase(subchild))];

            return P.each(data[property], childData => {
                // Check if need create or update relationship.
                if (!childData.id) {
                    childData[`id_${child.nomenclature.relationship}`] = model.id;

                    return childModel.create(childData, options).then(model => {
                        if (!model) {
                            throw new Errors.NotFound(`${_.startCase(relationship)} ${childData.id} not found`);
                        }
                        return model;
                    });
                }

                // Update relationship.
                return childModel.update(_.omit(childData, ['id']), childData.id, options).then(model => {
                    if (!model) {
                        throw new Errors.NotFound(`${_.startCase(relationship)} ${childData.id} not found`);
                    }
                    return model;
                });
            });
        });
    }

    function get (id, options) {
        if (!id) {
            throw new Errors.NotFound(`${child.nomenclature.title} not found`);
        }

        return models[child.model].getById(id, options).then(model => {
            if (!model) {
                throw new Errors.NotFound(`${child.nomenclature.title} ${id} not found`);
            }
            return model;
        });
    }
};
