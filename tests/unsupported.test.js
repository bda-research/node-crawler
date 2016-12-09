'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var given = require('mocha-testdata');

describe('Unsupported function test', function() {
    given.async("onDrain","preRequest","cache")
	.it('should throw exception when using unsupported options', function(done,key) {
	    var opt = {
		maxConnections: 10
            }
	    
	    opt[key]={};
	    expect(function(){Crawler(opt);}).to.throw(Error);
	    done();
	});
});
