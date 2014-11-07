'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var c;

describe('Simple test', function() {
    beforeEach(function() {
        c = new Crawler({
            forceUTF8: true
        });
    });
    afterEach(function() {
        c = {};
    });
    it('should run the readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            jquery: true,
            onDrain: function() {
                done();
            },
            callback: function(error, result) {
                expect(typeof result.body).to.equal('string');
            }
        });
        c.queue('http://google.com');
    });
    it('should run the with an array queue', function(done) {
        c = new Crawler();
        c.queue([{
            uri: 'http://www.google.com',
            jquery: true,
            callback : function(error, result, $) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect($).not.to.be.null;
                expect(typeof result.body).to.equal('string');
                done();
            }
        }]);
    });
});