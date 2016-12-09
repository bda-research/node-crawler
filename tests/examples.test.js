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
	    debug:true,
            callback: function(error, res,next) {
		expect(error).to.be.null;
                expect(typeof res.body).to.equal('string');
		next();
            }
        });
	
	c.on('drain', done);
        c.queue('http://github.com');
    });
    it('should run the readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            callback: function(error, res, next) {
		expect(error).to.be.null;
		var $ = res.$;
                $('a').each(function(index, a) {
                    var toQueueUrl = url.resolve(res.request.uri.href, $(a).attr('href'));
                    c.queue(toQueueUrl);
                });
		next();
            }
        });
	c.on('drain',function() {
            expect(spy.calledTwice).to.be.true;
            done();
        });
        spy = sinon.spy(c, 'queue');
        c.queue('http://'+httpbinHost+'/links/1/1');
    });
    it('should run the with an array queue', function(done) {
        c = new Crawler();
        c.queue([{
            uri: 'http://www.github.com',
            jquery: true,
            callback : function(error, res, next) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(res.$).not.to.be.null;
                expect(typeof res.body).to.equal('string');
		next();
            }
        }]);
	
	c.on('drain',done);
    });
});
