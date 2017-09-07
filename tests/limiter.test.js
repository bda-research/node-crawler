'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var httpbinHost = 'localhost:8000';
var c;
var result = [];

describe('Limiter feature tests', function() {
    describe('Option rateLimit', function() {
        beforeEach(function() {
            c = new Crawler({
                jquery: false,
                rateLimit: 300,
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    result.push(Date.now());
                    done();
                },
            });
        })

        afterEach(function() {
            c = {};
            result = [];
        });

        it('request speed should abide rateLimit', function(finishTest) {
            for(var i = 0; i < 5; i++) {
                c.queue('http://' + httpbinHost + '/status/200');
            }
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    result.push(Date.now());
                    expect(result.length).to.equal(6);
                    for(var i = 1; i < result.length; i++) {
                        var rateLimit = result[i] - result[i-1];
                        var diff = Math.abs(rateLimit-300);
                        expect(diff).to.be.at.most(60);
                    }
                    finishTest();
                }
            })
        });

        it('should be able to change rateLimit', function(finishTest) {
            c.setLimiterProperty('default', 'rateLimit', 500);
            for(var i = 0; i < 5; i++) {
                c.queue('http://' + httpbinHost + '/status/200');
            }
            c.queue({
                uri: 'http://' + httpbinHost + '/status/200',
                callback: function(error, res, done) {
                    expect(error).to.be.null;
                    expect(res.statusCode).to.equal(200);
                    result.push(Date.now());
                    expect(result.length).to.equal(6);
                    for(var i = 1; i < result.length; i++) {
                        var rateLimit = result[i] - result[i-1];
                        var diff = Math.abs(rateLimit-500);
                        expect(diff).to.be.at.most(100);
                    }
                    finishTest();
                }
            })
        });
    });
});