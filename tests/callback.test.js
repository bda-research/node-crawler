'use strict';

var Crawler = require('../lib/crawler');
var httpbinHost = 'localhost:8000';
var c;

describe('Callback test', function() {    
    afterEach(function() {
        c = {};
    });
    
    it('should end as expected without callback', function(done) {
	c = new Crawler({
            maxConnections: 10
        });
	
	c.on('drain', done);
        c.queue('http://'+httpbinHost+'/get');
    });

    it('should end as expected without callback when timedout', function(done) {
	c = new Crawler({
            maxConnections: 10,
	    retryTimeout:500,
	    retries:0,
	    timeout:1000
        });
	
	c.on('drain', done);
        c.queue('http://'+httpbinHost+'/delay/5');
    });
    
    it('should end as expected without callback when encoding error', function(done) {
	c = new Crawler({
            maxConnections: 10
        });
	
	c._doEncoding = function(){throw new Error("Error for testing.");};
	c.on('drain', done);
        c.queue('http://'+httpbinHost+'/get');
    });
});
