
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const given = require('mocha-testdata');

describe('Unsupported function test', function() {
	given.async('onDrain','preRequest','cache')
		.it('should throw exception when using  unsupported options', function(done,key) {
			const opt = {
				maxConnections: 10
			};
			
			opt[key] = {};
			expect(function(){Crawler(opt);}).to.throw(Error);
			done();
		});
});
