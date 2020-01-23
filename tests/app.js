'use strict';

const { Database } = require('steplix-database');
const { Apify } = require('../core/steplix');

const db = new Database({
  host: 'localhost',
  user: 'root',
  password: 'WwFFTRDJ7s2RgPWx',
  database: 'columbia'
});

const api = new Apify({
    mapping: {
        people: 'persons',
        parents: 'persons',
        account_origins: 'accounts',
        account_destinations: 'accounts'
    },
    db
});

api
    .run()
    .then(app => app.listen(8000));
