'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var request = require('request');
var httpbinHost = 'localhost:8000';
var c, spy;

describe('Jar Options', function() {
    afterEach(function() {
        c = spy = {};
    });
    it('should send with cookie when setting jar options', function(done) {
	var j = request.jar();
	var cookie = request.cookie('foo=bar');
	var url = 'http://'+httpbinHost+'/cookies';
	    
	j.setCookie(cookie, url);
        c = new Crawler({
            maxConnections: 10,
            jquery: false,
	    jar:j,
            callback: function(error, res,next) {
                expect(typeof res.statusCode).to.equal('number');
		var obj = JSON.parse(res.body);
		
                expect(`foo=${obj.cookies.foo}`).to.equal(j.getCookieString(url));
		next();
            }
        });
	
	c.on('drain',done);
        c.queue({
            uri: url
        });
	
    });
});
