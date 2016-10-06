'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpbinHost = 'localhost:8000';
var c;

describe('Cache features tests', function() {
    describe('Cache', function() {
        afterEach(function () {
            c = {};
        });
        it.skip('should crawl one url', function (done) {
            c = new Crawler({
		maxConnections:1,
		debug:true,
                cache: true,
                jquery: false,
                onDrain: function () //noinspection BadExpressionStatementJS,BadExpressionStatementJS
                {
                    expect(spy.calledOnce).to.be.true;
                    done();
                },
                callback: function (error, result) {
                    expect(error).to.be.null;
                    expect(result.statusCode).to.equal(200);
                }
            });
            var spy = sinon.spy(c, '_buildHttpRequest');
            c.queue(['http://'+httpbinHost, 'http://' + httpbinHost, 'http://' + httpbinHost, 'http://' + httpbinHost]);
        });
    });

    describe('Skip Duplicate active', function() {
        afterEach(function () {
            c = {};
        });    
        
        it('should not skip one single url', function (done) {
            c = new Crawler({
                jquery: false,
                skipDuplicates: true,
                callback: function (error, result) {
                    expect(error).to.be.null;
                    expect(result.statusCode).to.equal(200);
                    done();
                },
            });

            c.queue('http://' + httpbinHost + '/status/200');
        });

        //it('should skip previous crawled urls', function (done) {});
    });
});

