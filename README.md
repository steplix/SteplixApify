# Steplix Apify

Steplix Apify is Database mapper to routes.


## Index

* [Download & Install][install].
* [How is it used?][how_is_it_used].
* [Run][Run].
* [Tests][tests].

## Download & Install

### NPM
```bash
$ npm install steplix-apify
```

### Source code
```bash
$ git clone https://github.com/steplix/SteplixApify.git
$ cd SteplixApify
$ npm install
```

## How is it used?

**What?**
Will automatically expose ExpressJs routes based on your MySQL structure and handle them for you.

**A lot of value!**
If you follow the Steplix Apify MySQL nomenclature, then you will get a CRUD (Create, Read, Update and Delete) without writing any line of code! Yes, a lot for free.-

**Assumptions**
Steplix Apify understands `3 types` of MySQL tables structure strategy.

**TYPE A - Relantionships whitin 2 differentes models:**

MySQL Table: `measurements`
```
mysql> select * from measurements;
+----+-----------+---------+---------+---------------------+
| id | id_metric | id_unit | amount  | created_at          |
+----+-----------+---------+---------+---------------------+
|  1 |         1 |       1 | 37.1200 | 2019-04-18 21:53:01 |
|  2 |         1 |       1 | 36.2400 | 2019-04-18 21:53:01 |
|  3 |         1 |       1 | 38.7100 | 2019-04-18 21:53:01 |
|  4 |         1 |       1 | 35.2900 | 2019-04-18 21:53:01 |
|  5 |         1 |       1 | 38.8100 | 2019-04-18 21:53:01 |
|  6 |         1 |       1 | 37.4100 | 2019-04-18 21:53:01 |
|  7 |         1 |       1 | 36.5600 | 2019-04-18 21:53:01 |
|  8 |         1 |       1 | 37.0500 | 2019-04-18 21:53:01 |
+----+-----------+---------+---------+---------------------+
8 rows in set (0.00 sec)
```


MySQL Table: `metrics`
```
mysql> select * from metrics;
+----+----------------+
| id | description    |
+----+----------------+
|  1 | humidity       |
|  2 | temperature    |
|  3 | precipitations |
|  4 | voltage        |
+----+----------------+
4 rows in set (0.01 sec)
```


MySQL Table: `units`
```
mysql> select * from units;
+----+-------------+------+
| id | description | unit |
+----+-------------+------+
|  1 | percentage  | %    |
|  2 | celsius     | Cº   |
|  3 | millivolt   | mV   |
+----+-------------+------+
3 rows in set (0.00 sec)
```


**TYPE B - Model (2-N) Dependencies:**

MySQL Table: `users`
```
mysql> select * from users;
+----+--------+---------------------+------------+
| id | active | created_at          | updated_at |
+----+--------+---------------------+------------+
|  1 |      1 | 2019-04-18 21:53:01 | NULL       |
|  2 |      1 | 2019-04-18 21:53:01 | NULL       |
|  3 |      1 | 2019-04-18 21:53:01 | NULL       |
+----+--------+---------------------+------------+
3 rows in set (0.00 sec)
```

MySQL Table: `user_permissions`
```
mysql> select * from user_permissions;
+----+---------+---------------+--------+---------------------+------------+
| id | id_user | id_permission | active | created_at          | updated_at |
+----+---------+---------------+--------+---------------------+------------+
|  1 |       1 |             1 |      1 | 2019-04-18 21:53:01 | NULL       |
|  2 |       2 |             2 |      1 | 2019-04-18 21:53:01 | NULL       |
|  3 |       3 |             3 |      1 | 2019-04-18 21:53:01 | NULL       |
|  4 |       4 |             1 |      1 | 2019-04-18 21:53:01 | NULL       |
|  5 |       5 |             3 |      1 | 2019-04-18 21:53:01 | NULL       |
|  6 |       6 |             1 |      1 | 2019-04-18 21:53:01 | NULL       |
|  7 |       7 |             3 |      1 | 2019-04-18 21:53:01 | NULL       |
+----+---------+---------------+--------+---------------------+------------+
7 rows in set (0.00 sec)
```


**TYPE C - Model (1) Dependency:**

MySQL Table: `devices`
```
mysql> select * from devices;
+----+-----------------+----------------------+-------------+---------------------+
| id | id_device_brand | id_device_screensize | description | created_at          |
+----+-----------------+----------------------+-------------+---------------------+
|  1 |               1 |                    2 | Samsung S7  | 2019-04-18 22:15:28 |
|  2 |               1 |                    1 | Samsung S8  | 2019-04-18 22:15:28 |
|  3 |               1 |                    1 | Samsung S9  | 2019-04-18 22:15:28 |
|  4 |               3 |                    1 | iPhone 8    | 2019-04-18 22:15:28 |
+----+-----------------+----------------------+-------------+---------------------+
4 rows in set (0.01 sec)
```

MySQL Table: `device_brands`
```
mysql> select * from device_brands;
+----+-------------+---------------------+
| id | description | created_at          |
+----+-------------+---------------------+
|  1 | Samsung     | 2019-04-18 22:17:00 |
|  2 | Motorola    | 2019-04-18 22:17:00 |
|  3 | Apple       | 2019-04-18 22:17:00 |
+----+-------------+---------------------+
3 rows in set (0.00 sec)
```

MySQL Table: `device_screensizes`
```
mysql> select * from device_screensizes;
+----+-------------+---------------------+
| id | description | created_at          |
+----+-------------+---------------------+
|  1 | 1440×2560   | 2019-04-18 22:17:00 |
|  2 | 750×1334    | 2019-04-18 22:17:00 |
|  3 | 720×1280    | 2019-04-18 22:17:00 |
+----+-------------+---------------------+
3 rows in set (0.01 sec)
```


### Run
```js
'use strict';

const { Database } = require('steplix-database');
const { Apify } = require('steplix-apify');

const database = new Database({
  host: 'localhost',
  user: 'root',
  password: 'WwFFTRDJ7s2RgPWx',
  database: 'columbia'
});

const api = new Apify({ database });

api
    .run()
    .then(app => app.listen(8000));
```


## Tests

In order to see more concrete examples, **I INVITE YOU TO LOOK AT THE TESTS :)**

### Run the unit tests
```sh
npm test
```

### Run an application (server) with a more formal example.
```sh
npm run test-app
```

<!-- deep links -->
[install]: #download--install
[how_is_it_used]: #how-is-it-used
[run]: #run
[tests]: #tests
