'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var sinon = require('sinon');
var url = require('url');
var c, spy;

describe('Simple test', function() {
    afterEach(function() {
        c = {};
        spy = {};
    });
    it('should run the first readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            onDrain: function() {
                done();
            },
            callback: function(error, result) {
                expect(typeof result.body).to.equal('string');
            }
        });
        c.queue('http://google.com');
    });
    it('should run the readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            onDrain: function() {
                expect(spy.calledTwice).to.be.true;
                done();
            },
            callback: function(error, result, $) {
                var baseUrl = result.uri;
                $('a').each(function(index, a) {
                    var toQueueUrl = url.resolve(baseUrl, $(a).attr('href'));
                    c.queue(toQueueUrl);
                });
            }
        });
        spy = sinon.spy(c, 'queue');
        c.queue('http://'+httpbinHost+'/links/1/1');
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