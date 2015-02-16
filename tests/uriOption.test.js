'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpbinHost = 'localhost:8000';
var c, spy;

describe('Uri Options', function() {
    afterEach(function() {
        c = spy = {};
    });
    it('should work if uri is a function', function(done) {
        var statusCode = 200;
        var uriFunction = function(statusCode) {
            return 'http://'+httpbinHost+'/status/'+statusCode;
        };
        c = new Crawler({
            maxConnections: 10,
            jquery: false,
            onDrain: function() {
                done();
            },
            callback: function(error, result) {
                expect(typeof result.statusCode).to.equal('number');
                expect(result.statusCode).to.equal(statusCode);
            }
        });
        c.queue({
            uri: uriFunction(statusCode)
        });
    });
    it('should work if uri is a function, example from Readme', function(done) {
        var googleSearch = function(search) {
            return 'http://www.google.fr/search?q=' + search;
        };
        c = new Crawler({
            maxConnections: 10,
            onDrain: function() {
                done();
            },
            callback: function(error, result) {
                expect(typeof result.statusCode).to.equal('number');
                expect(result.statusCode).to.equal(200);
            }
        });
        c.queue({
            uri: googleSearch('cheese')
        });
    });
    it('should skip if the uri is undefined or an empty string', function(done) {
        c = new Crawler({
            onDrain: function() {
                expect(spy.calledOnce).to.be.true;
                done();
            },
            callback: function(error, result) {
                expect(typeof result.statusCode).to.equal('number');
                expect(result.statusCode).to.equal(200);
            }
        });
        spy = sinon.spy(c, '_pushToQueue');
        c.queue([undefined, 'http://'+httpbinHost]);
    });
});