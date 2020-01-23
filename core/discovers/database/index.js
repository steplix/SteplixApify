'use strict';

const _ = require('lodash');
const P = require('bluebird');
const async = require('async');
const pluralize = require('pluralize');
const ApifyModel = require('./model');
const { filterMatches } = require('../../helpers');

const defaultOptions = {
    mapping: {},
    models: {
        mapFieldName: 'name'
    },
    fields: {
        mapFieldName: 'Field',
        logicalDeleteFieldName: 'active'
    }
};

const MODELS_INSTANCES = {};

class Discoverer {
    constructor (options) {
        this.options = _.defaultsDeep({}, options || {}, defaultOptions);
        this.db = this.options.db || this.options.database;
        this.data = {};

        if (!this.db) {
            throw new Error('Database discoverer need options.connection instance of steplix-database for work');
        }
    }

    queryTables () {
        return `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.db.options.database}'`;
    }

    queryFields (table) {
        return `SHOW COLUMNS FROM ${table}`;
    }

    discover () {
        return P.bind(this)
            .then(this.tables)
            .then(this.models)
            .return(this.data);
    }

    tables () {
        return this.db
            // Find all table names on the database.
            .query(this.queryTables())
            // Only take the name of each table.
            .then(tables => {
                this.data.allModels = _.map(tables, this.options.models.mapFieldName);
                return this.data.allModels;
            })
            // Filter table names if necesary.
            .then(tables => filterMatches(tables, this.options.models))
            // Make table object of each matched table name.
            .then(tables => {
                return new P((resolve, reject) => {
                    async.map(tables, (table, next) => this.table(table, tables).then(table => next(null, table)).catch(next), (error, result) => {
                        if (error) return reject(error);
                        return resolve(result);
                    });
                });
            })
            .then(tables => {
                this.data.tables = _.keyBy(tables, 'name');
                return this.data.tables;
            })
            // Get the relationships: this will resolve all related tables (ex. 'users' > many > ['user_attributes'])
            .then(() => {
                return new P((resolve, reject) => {
                    async.map(this.data.tables, (table, next) => {
                        return this.relationships(table)
                            .then(relationships => {
                                table.relationships = relationships;
                                return relationships;
                            })
                            .then(() => next(null, table))
                            .catch(next);
                    }, (error, result) => {
                        if (error) return reject(error);
                        return resolve(result);
                    });
                });
            })
            .return(this.data.tables);
    }

    table (name, tables) {
        const singularName = `${pluralize.singular(name)}_`;
        const table = {
            name,
            // Define all table nomemclature
            nomenclature: {
                table: name
            },
            // Get the children: this will find all related tables (ex. 'users' > ['user_attributes'])
            children: _.filter(tables, table => _.startsWith(table, singularName))
        };

        // Resolve table options (hidden, cast, rename)
        if (this.options.models[table.name]) {
            if (this.options.models[table.name].hidden) {
                table.hidden = this.options.models[table.name].hidden;
            }
            if (this.options.models[table.name].cast) {
                table.cast = this.options.models[table.name].cast;
            }
            if (this.options.models[table.name].rename) {
                table.rename = this.options.models[table.name].rename;
            }
        }

        return P.bind(this)
            .then(() => this.fields(name))
            .then(fields => {
                table.fields = fields;
                return table;
            })
            .then(() => {
                // Checking if options.fields.logicalDeleteFieldName attribute exists. In that case, deletion method will be by boolean.
                table.logicalDelete = {
                    enabled: table.fields.includes(this.options.fields.logicalDeleteFieldName),
                    fieldName: this.options.fields.logicalDeleteFieldName
                };
                return table;
            })
            .return(table);
    }

    fields (table) {
        return this.db.query(this.queryFields(table)).then(result => _.map(result, this.options.fields.mapFieldName));
    }

    relationships (table) {
        const name = pluralize.singular(table.name);
        const id = `id_${name}`;
        const rs = {};

        table.nomenclature.relationship = name;

        return P.bind(this)
            // Get relationships: this will understand if each related table is 1:1 or 1:N extension
            .then(() => {
                return P.each(table.children, child => {
                    var isManyRelationship = this.data.tables[child].fields.includes(id);

                    if (isManyRelationship) {
                        rs.many = rs.many || [];
                        rs.many.push(child);
                    }
                    else {
                        rs.one = rs.one || [];
                        rs.one.push(child);
                    }
                    return rs;
                });
            })
            // Get relationships: this will get 1:1 external relationships (ex. 'users' > ['roles'])
            .then(() => {
                return P.each(table.fields, field => {
                    if (_.startsWith(field, 'id_') && !field.includes(name)) {
                        rs.one = rs.one || [];

                        // 'id_role' > 'roles'
                        let child = pluralize.plural(field.slice(3));

                        // Resolve child table mapping
                        if (this.options.mapping[child]) {
                            child = this.options.mapping[child];
                        }
                        rs.one.push(child);
                    }
                    return rs;
                });
            })
            .return(rs);
    }

    models () {
        this.data.models = {};

        return P.bind(this)
            .then(() => {
                return new P((resolve, reject) => {
                    async.each(this.data.tables, (table, next) => {
                        return this.model(table).then(() => next(null)).catch(next);
                    }, (error) => {
                        if (error) return reject(error);
                        return resolve();
                    });
                });
            })
            .return(this.data.models);
    }

    model (table) {
        const modelName = _.upperFirst(_.camelCase(table.name));
        const models = this.data.models;
        const database = this.db;

        table.model = modelName;
        table.nomenclature.model = modelName;
        table.nomenclature.title = _.startCase(pluralize.singular(modelName));

        Object.defineProperty(this.data.models, modelName, {
            configurable: true,
            enumerable: true,
            get: function () {
                let instance = MODELS_INSTANCES[modelName];

                if (!instance) {
                    instance = MODELS_INSTANCES[modelName] = new ApifyModel(table.name, {
                        scheme: table,
                        database
                    });
                    instance.models = models;
                }
                return instance;
            }
        });

        return P.resolve(models);
    }
}

module.exports = Discoverer;
