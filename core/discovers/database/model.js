'use strict';

const _ = require('lodash');
const P = require('bluebird');
const pluralize = require('pluralize');
const { Model } = require('steplix-database');

// Remove previous value.
function _unset (object, property, newlyProperty = null) {
    // Check if original attribute name if a nested attribute name.
    // Example:
    //    price is original attribute name
    //    price.value is copy attribute name
    //    We does not need delete the original attribute
    if (newlyProperty && property.indexOf('.') === -1) {
        if (!newlyProperty.split('.').includes(property)) {
            _.unset(object, property);
        }
        return;
    }

    // The original attribute name is a nested attribute name.
    _.unset(object, property);

    const parts = property.split(/\./).reverse();
    let history = '';

    parts.forEach((part, index) => {
        history = `${(index + 1) === parts.length ? '' : '.'}${part}` + history;

        const name = property.replace(history, '');

        if (name && _.isEmpty(_.get(object, name))) {
            return _.unset(object, name);
        }
        return false;
    });
}

class ApifyModel extends Model {
    populate (model, options) {
        return P.bind(this)
            .then(() => super.populate(model, options))
            .then(() => this.populateOne(model, options))
            .then(() => this.populateMany(model, options))
            .then(() => this.populateProperties(model, options));
    }

    populateOne (model, options) {
        options = options || {};

        // Check if only need model (tiny) or not has one to one relationships
        if (options.tiny || _.isEmpty(this.options.scheme.relationships.one)) {
            return P.resolve(model);
        }

        const entity = pluralize.singular(this.entity);

        return P.each(this.options.scheme.relationships.one, child => {
            // Build property name. Ex. child = 'device_brands' singularized = 'device_brand'
            const property = pluralize.singular(child);
            const idField = `id_${property}`;
            const id = model[idField];

            if (!id || (options.withOut && (options.withOut.includes(entity) || options.withOut.includes(property)))) {
                delete model[idField];
                return model;
            }

            const opts = {
                withOut: [entity]
            };

            if (options.withOut) {
                opts.withOut = options.withOut.concat(opts.withOut);
            }

            const childModel = this.models[_.upperFirst(_.camelCase(child))];

            if (!childModel) {
                return model;
            }
            return childModel.getById(id, opts).then(result => {
                if (result) {
                    model[property.replace(`${entity}_`, '')] = result;
                    delete model[idField];
                }
                return model;
            });
        })
            .return(model);
    }

    populateMany (model, options) {
        options = options || {};

        // Check if only need model (tiny) or not has one to many/many to one relationships.
        if (options.tiny || _.isEmpty(this.options.scheme.relationships.many)) {
            return P.resolve(model);
        }

        const entity = pluralize.singular(this.entity);

        return P.each(this.options.scheme.relationships.many, child => {
            child = _.camelCase(child);

            const property = _.camelCase(child.replace(entity, ''));

            if (options.withOut && options.withOut.includes(property)) {
                return model;
            }

            const modelName = _.upperFirst(child);
            const idField = `id_${entity}`;
            const opts = {
                where: {
                    [idField]: model.id
                },
                withOut: [entity]
            };

            const childModel = this.models[modelName];

            if (!childModel) {
                return model;
            }
            return childModel.find(opts).then(results => {
                if (results) {
                    model[property] = _.map(results, result => {
                        delete result[idField];
                        return result;
                    });
                }
                return model;
            });
        })
            .return(model);
    }

    populateProperties (model, options) {
        options = options || {};

        // Check if need raw model.
        if (options.raw) {
            return P.resolve(model);
        }

        // Apply casting
        if (!_.isEmpty(this.options.scheme.cast)) {
            _.each(this.options.scheme.cast, (property, caster) => {
                const value = caster(_.get(model, property), property, model);

                if (!_.isNil(value)) {
                    _.set(model, property, value);
                }
            });
        }
        // Apply rename
        if (!_.isEmpty(this.options.scheme.rename)) {
            _.each(this.options.scheme.rename, (as, property) => {
                const value = _.get(model, property);

                if (!_.isNil(value)) {
                    _.set(model, as, value);
                }
                _unset(model, property, as);
            });
        }
        // Apply hidden
        if (!_.isEmpty(this.options.scheme.hidden)) {
            _.each(this.options.scheme.hidden, property => {
                _unset(model, property);
            });
        }
        return model;
    }
}

module.exports = ApifyModel;
