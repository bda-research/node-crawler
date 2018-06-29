/**
 *
 * While using nock, suppose all response return almost in no time.
 * In order to measure limiter effects, set Crawler rateLimit to 500ms.
 *
 */
'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var nock = require('nock');

var c;
var tsArrs = [];

describe('Limiter tests', function () {
	this.timeout(10000);
	before(function () {
		nock.cleanAll();
	});
	beforeEach(function () {
		nock('http://nockHost').get(uri => uri.indexOf('status') >= 0).times(5).reply(200, 'Yes');

		c = new Crawler({
			jquery: false,
			rateLimit: 500,
			callback: function (err, result, done) {
				expect(err).to.be.equal(null);
				expect(result.statusCode).to.equal(200);
				done();
			},
		});
		c.on('request', () => tsArrs.push(Date.now()));
	});
	afterEach(function () {
		c = {};
		tsArrs = [];
	});

	it('One limiter, tasks should execute one by one', function (done) {
		for (var i = 0; i < 5; i++) {
			// limiter is 'default', if not assigned explicitly
			c.queue({ uri: 'http://nockHost/status/200' });
		}
		c.on('drain', function () {
			expect(tsArrs.length).to.equal(5);
			// setTimeout in nodejs is delayed
			// 4 rateLimit +- 50ms = 4 * 500 +- 50
			expect(tsArrs[4] - tsArrs[0]).to.be.least(1950);
			expect(tsArrs[4] - tsArrs[0]).to.be.most(2050);

			done();
		});
	});
	it('Multiple limiters, tasks should execute in parallel', function (done) {
		for (var i = 0; i < 5; i++) {
			c.queue({ uri: 'http://nockHost/status/200', limiter: i });
		}
		c.on('drain', function () {
			expect(tsArrs.length).to.equal(5);
			// setTimeout in nodejs is delayed
			// request sent almost at same time
			expect(tsArrs[4] - tsArrs[0]).to.be.most(50);

			done();
		});
	});
	it('Multiple limiters are mutual independent', function (done) {
		for (var i = 0; i < 5; i++) {
			var limiter = i === 4 ? 'second' : 'default';
			c.queue({ uri: 'http://nockHost/status/200', limiter: limiter });
		}
		c.on('drain', function () {
			expect(tsArrs.length).to.equal(5);
			// setTimeout in nodejs is delayed
			// 3 rateLimit +- 50ms = 3 * 500 +- 50
			expect(tsArrs[4] - tsArrs[0]).to.be.least(1450);
			expect(tsArrs[4] - tsArrs[0]).to.be.most(1550);

			done();
		});
	});
});