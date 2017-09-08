'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpbinHost = 'localhost:8000';
var c;
var result = [];
var preRequestResult = [];

describe('preRequest feature tests', function() {
    describe('Option preRequest', function() {
        afterEach(function() {
            c = {};
            result = [];
            preRequestResult = [];
        });

        it('should do preRequest before request when preRequest defined in crawler options', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                preRequest: function(options, done) {
                    setTimeout(function() {
                        preRequestResult.push(options.uri);
                        done();
                    }, 200);
                }
            });
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(preRequestResult.length).to.equal(1);
                    expect(preRequestResult[0]).to.equal(res.options.uri);
                    done();
                    finishTest();
                }
            })
        });

        it('should do preRequest before request when preRequest defined in queue options', function(finishTest) {
            c = new Crawler({
                jQuery: false,
            });
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                preRequest: function(options, done) {
                    setTimeout(function() {
                        preRequestResult.push(options.uri);
                        done();
                    }, 200);
                },
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(preRequestResult.length).to.equal(1);
                    expect(preRequestResult[0]).to.equal(res.options.uri);
                    done();
                    finishTest();
                }
            })
        });

        it('preRequest should be executed the same times as request', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                rateLimit: 200,
                preRequest: function(options, done) {
                    setTimeout(function() {
                        preRequestResult.push(options.uri);
                        done();
                    }, 200);
                },
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    expect(preRequestResult[preRequestResult.length-1]).to.equal(res.options.uri);
                    result.push(res.options.uri);
                    expect(preRequestResult.length).to.equal(result.length);
                    done();
                }
            });
            for(var i = 0; i < 5; i++) {
                c.queue('http://' + httpbinHost + '/status/200')
            }
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    finishTest();
                }
            })
        });

        it('when preRequest fail, should retry three times by default', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                rateLimit: 300,
                retryTimeout: 0,
                preRequest: function(options, done) {
                    preRequestResult.push(options.uri);
                    var error = new Error();
                    done(error);
                },
                callback: function(error, res, done) {
                    expect(error).to.not.equal(null);
                    expect(preRequestResult.length).to.equal(4);
                    finishTest();
                }
            });
            c.queue('http://' + httpbinHost + '/status/200');
        });

        it('when preRequest fail, should return error when error.op = \'fail\'', function(finishTest) {
            c = new Crawler({
                jQuery: false,
                rateLimit: 300,
                retryTimeout: 0,
                preRequest: function(options, done) {
                    preRequestResult.push(options.uri);
                    var error = new Error();
                    error.op = 'fail';
                    done(error);
                },
                callback: function(error, res, done) {
                    expect(error).to.not.equal(null);
                    expect(preRequestResult.length).to.equal(1);
                    finishTest();
                }
            });
            c.queue('http://' + httpbinHost + '/status/200');
        });

        it('when preRequest fail, callback should not be called when error.op = \'abort\'', function(finishTest) {
            var counter = 0;
            c = new Crawler({
                jQuery: false,
                rateLimit: 300,
                retryTimeout: 0,
                preRequest: function(options, done) {
                    if(++counter >= 2) {
                        expect(spy.notCalled).to.be.true;
                        finishTest();
                    }
                    preRequestResult.push(options.uri);
                    var error = new Error();
                    error.op = 'abort';
                    done(error);
                },
                callback: function(error, res, done) {
                    expect(null).to.equal(1);
                }
            });
            var spy = sinon.spy(c.options, 'callback');
            c.queue('http://' + httpbinHost + '/status/200');
            c.queue('http://' + httpbinHost + '/status/200');
        });

        it('when preRequest fail, should put request back in queue when error.op = \'queue\'', function(finishTest) {
            var counter = 0;
            c = new Crawler({
                jQuery: false,
                rateLimit: 300,
                retryTimeout: 0,
                preRequest: function(options, done) {
                    expect(options.retries).to.equal(3);
                    var error = new Error();
                    error.op = 'queue';
                    if(++counter > 3) {
                        expect(preRequestResult.length).to.equal(3);
                        finishTest();
                        // if error.op not set to abort, the task will continue, test will fail if you have more tests to go other than this
                        error.op = 'abort';
                    }
                    preRequestResult.push(options.uri);
                    done(error);
                },
                callback: function(error, res, done) {
                    expect(null).to.equal(1);
                }
            });
            c.queue('http://' + httpbinHost + '/status/200');
        });
    });
});