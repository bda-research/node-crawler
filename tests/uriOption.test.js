'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;

describe('Uri Options', function() {
    afterEach(function() {
        c = {};
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
});