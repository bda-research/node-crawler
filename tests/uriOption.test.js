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
            callback: function(error, res,next) {
                expect(typeof res.statusCode).to.equal('number');
                expect(res.statusCode).to.equal(statusCode);
		next();
            }
        });
	
	c.on('drain',done);
        c.queue({
            uri: uriFunction(statusCode)
        });
    });
    it('should work if uri is a function, example from Readme', function(done) {
        var googleSearch = function(search) {
            return 'http://www.bing.com/search?q=' + search;
        };
        c = new Crawler({
            maxConnections: 10,
            callback: function(error, res,next) {
                expect(typeof res.statusCode).to.equal('number');
                expect(res.statusCode).to.equal(200);
		next();
            }
        });
	
	c.on('drain',done);
        c.queue({
            uri: googleSearch('cheese')
        });
    });
    it('should skip if the uri is undefined or an empty string', function(done) {
        c = new Crawler({
            callback: function(error, res,next) {
                expect(typeof res.statusCode).to.equal('number');
                expect(res.statusCode).to.equal(200);
		next();
            }
        });
        spy = sinon.spy(c, '_pushToQueue');
	
	c.on('drain',function() {
            expect(spy.calledOnce).to.be.true;
            done();
        });
        c.queue([undefined,null,[], 'http://'+httpbinHost]);
    });
});
