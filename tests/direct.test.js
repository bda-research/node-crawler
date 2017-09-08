'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpbinHost = 'localhost:8000';
var c;
var result = [];
var preRequestResult = [];

describe('Direct feature tests', function() {
    describe('Method direct', function() {
        afterEach(function() {
            c = {};
            result = [];
            preRequestResult = [];
        });

        it('should not trigger preRequest', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                preRequest: function(options, done) {
                    preRequestResult.push(options.uri);
                    done();
                }
            });
            c.direct({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(preRequestResult.length).to.equal(0);
                    finishTest();
                }
            });
        });

        it('should be sent directly regardless of current queue of crawler', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                rateLimit: 500,
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    result.push(res.options.uri);
                    done();
                }
            });
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    result.push(res.options.uri);
                    c.direct({
                        uri: 'http://' + httpbinHost + '/status/200',
                        callback: function(error, res) {
                            expect(error).to.be.null;
                            expect(res.statusCode).to.equal(200);
                            expect(result.length).to.equal(1);
                            preRequestResult.push(res.options.uri);
                        }
                    });
                    done();
                }
            });
            c.queue('http://' + httpbinHost + '/status/200');
            c.queue('http://' + httpbinHost + '/status/200');
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(result.length).to.equal(3);
                    expect(preRequestResult.length).to.equal(1);
                    expect(preRequestResult[0]).to.equal('http://' + httpbinHost + '/status/200');
                    done();
                    finishTest();
                }
            });
        });

        it('should not trigger Event:request by default', function(finishTest) {
            var events = [];
            c = new Crawler({
                jQuery: false
            });
            c.on('request', function(options) {
                events.push('request');
            });
            c.direct({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(events.length).to.equal(0);
                    finishTest();
                }
            }); 
        });

        it('should trigger Event:request if specified in options', function(finishTest) {
            var events = [];
            c = new Crawler({
                jQuery: false
            });
            c.on('request', function(options) {
                events.push('request');
            });
            c.direct({
                uri: 'http://' + httpbinHost + '/status/200',
                skipEventRequest: false,
                callback: function(error, res) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(events.length).to.equal(1);
                    finishTest();
                }
            });
        });

    });
});