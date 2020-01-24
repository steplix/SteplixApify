'use strict';

const http = require('http-constants');
const { Errors } = require('steplix-http-exception');

describe('Errors', () => {
    describe('InternalServerError', () => {
        it(`should return code/status ${http.codes.INTERNAL_SERVER_ERROR}`, done => {
            const result = new Errors.InternalServerError();

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.INTERNAL_SERVER_ERROR);
            expect(result).to.have.property('message').to.be.a('string').equal('Internal Server Error');

            done();
        });
    });

    describe('NotFound', () => {
        it(`should return code/status ${http.codes.NOT_FOUND}`, done => {
            const result = new Errors.NotFound();

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.NOT_FOUND);
            expect(result).to.have.property('message').to.be.a('string').equal('Not Found');

            done();
        });
    });

    describe('Conflict', () => {
        it(`should return code/status ${http.codes.CONFLICT}`, done => {
            const result = new Errors.Conflict();

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.CONFLICT);
            expect(result).to.have.property('message').to.be.a('string').equal('Conflict');

            done();
        });
    });

    describe('Unauthorized', () => {
        it(`should return code/status ${http.codes.UNAUTHORIZED}`, done => {
            const result = new Errors.Unauthorized();

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.UNAUTHORIZED);
            expect(result).to.have.property('message').to.be.a('string').equal('Unauthorized');

            done();
        });
    });

    describe('BadRequest', () => {
        it(`should return code/status ${http.codes.BAD_REQUEST}`, done => {
            const result = new Errors.BadRequest();

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.BAD_REQUEST);
            expect(result).to.have.property('message').to.be.a('string').equal('Bad Request');

            done();
        });
    });

    describe('JsonErrorResponse', () => {
        it(`should return code/status ${http.codes.INTERNAL_SERVER_ERROR}`, done => {
            const data = { a: 'b', c: 1 }
            const result = new Errors.JsonErrorResponse(data);

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.INTERNAL_SERVER_ERROR);
            expect(result).to.have.property('message').to.be.a('string').equal('Json Error Response');
            expect(result.toJson()).to.have.property('a').to.be.a('string').equal(data.a);

            done();
        });
    });

    describe('CustomError', () => {
        it(`should return code/status ${http.codes.INTERNAL_SERVER_ERROR}`, done => {
            const result = new Errors.CustomError('Custom Error');

            expect(result).to.have.property('code').to.be.a('number').equal(http.codes.INTERNAL_SERVER_ERROR);
            expect(result).to.have.property('message').to.be.a('string').equal('Custom Error');

            done();
        });
    });
});
