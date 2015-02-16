'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;

describe('Request tests', function() {
    afterEach(function() {
        c = {};
    });
    it('should crawl one request', function(done) {
        c = new Crawler({
            jquery: false,
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                expect(result.statusCode).to.equal(200);
                done();
            }
        });
        c.queue(['http://'+httpbinHost+'/status/200']);
    });
    it('should crawl two request request and execute the onDrain() callback', function(done) {
        c = new Crawler({
            jquery: false,
            callback: function(error, result) {
                expect(error).to.be.null;
                expect(result.body.length).to.be.above(1000);
            },
            onDrain: function() {
                done();
            }
        });
        c.queue(['http://'+httpbinHost+'/html', 'http://'+httpbinHost]);
    });
    it('should crawl a gzip response', function(done) {
        c = new Crawler({
            jquery: false,
            callback:function(error, result) {
                expect(error).to.be.null;
                try {
                    var body = JSON.parse(result.body);
                    expect(body.gzipped).to.be.true;
                    expect(body.headers['Accept-Encoding']).to.equal('gzip');
                } catch (ex) {
                    expect(false).to.be.true;
                }
                done();
            }
        });
        c.queue('http://'+httpbinHost+'/gzip');
    });
    it('should use the provided user-agent', function(done) {
        c = new Crawler({
            userAgent: 'test/1.2',
            jQuery: false,
            callback:function(error, result) {
                expect(error).to.be.null;
                try {
                    var body = JSON.parse(result.body);
                    expect(body['user-agent']).to.equal('test/1.2');
                } catch (ex) {
                    expect(false).to.be.true;
                }
                done();
            }
        });
        c.queue(['http://'+httpbinHost+'/user-agent']);
    });
    it('should spoof the referer', function(done) {
        c = new Crawler({
            referer: 'http://spoofed.com',
            jQuery: false,
            callback:function(error, result) {
                expect(error).to.be.null;
                try {
                    var body = JSON.parse(result.body);
                    expect(body.headers.Referer).to.equal('http://spoofed.com');
                } catch (ex) {
                    expect(false).to.be.true;
                }
                done();
            }
        });
        c.queue(['http://'+httpbinHost+'/headers']);
    });
});