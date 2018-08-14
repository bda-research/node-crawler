/**
 *
 * 1. Suppose response will not return before next rateLimit.
 *
 */
'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var nock = require('nock');

var c;
var tsArrs = [];

describe('rateLimit tests', function () {

	before(function () {
		nock.cleanAll();
	});

	/**
	 *
	 * Suppose response will not return before next rateLimit cycle.
	 *
	 */
	// Setup
	beforeEach(function () {
		c = new Crawler({
			jquery: false,
			rateLimit: 300,
			callback: function (err, result, done) {
				expect(err).to.be.equal(null);
				expect(result.statusCode).to.equal(200);
				done();
			},
		});
		c.on('request', () => tsArrs.push(Date.now()));
	});
	// Clear
	afterEach(function () {
		c = {};
		tsArrs = [];
	});

	describe('Exceed rateLimit', function () {
		before(function () {
			nock('http://nockHost').get(uri => uri.indexOf('status') >= 0).times(2).delay(500).reply(200, 'Yes');
		});

		it('Interval of two requests should be no less than 500ms', function (testDone) {
			c.queue({ uri: 'http://nockHost/status/200' });
			c.queue({
				uri: 'http://nockHost/status/200',
				callback: function (err, result, done) {
					expect(err).to.be.equal(null);
					expect(result.statusCode).to.equal(200);
					done();

					expect(tsArrs.length).to.equal(2);
					expect(tsArrs[1] - tsArrs[0]).to.be.least(450);

					testDone();
				}
			});
		});


	});

	/**
	 *
	 * Suppose response will return before next rateLimit cycle.
	 *
	 */
	describe('Abide rateLimit', function () {

		// Ensure current senario ends in 5s.
		this.timeout(3000);
		before(function () {
			nock('http://nockHost').get(uri => uri.indexOf('status') >= 0).times(10).reply(200, 'Yes');

		});

		it('request speed should abide rateLimit', function (done) {
			for (var i = 0; i < 5; i++) {
				c.queue('http://nockHost/status/200');
			}

			c.on('drain', function () {
				expect(tsArrs.length).to.equal(5);
				for (var i = 1; i < tsArrs.length; i++) {
					var interval = tsArrs[i] - tsArrs[i - 1];
					// setTimeout() in nodejs doesn't guarantee action will occur at time(timestamp) you assigned
					// so 10% of rateLimit time will be given to assert
					var diff = Math.abs(interval - 300);
					expect(diff).to.be.most(30);
				}

				done();
			});
		});

		it('should be able to modify rateLimit', function (done) {
			c.setLimiterProperty('default', 'rateLimit', 500);
			for (var i = 0; i < 5; i++) {
				c.queue('http://nockHost/status/200');
			}

			c.on('drain', function () {
				expect(tsArrs.length).to.equal(5);
				for (var i = 1; i < tsArrs.length; i++) {
					var interval = tsArrs[i] - tsArrs[i - 1];
					var diff = Math.abs(interval - 500);
					// setTimeout() in nodejs doesn't guarantee action will occur at time(timestamp) you assigned
					// so 10% of rateLimit time will be given to assert
					expect(diff).to.be.at.most(50);
				}

				done();
			});
		});

	});
});