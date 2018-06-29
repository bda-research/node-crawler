/*jshint expr:true */
'use strict';
var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var sinon = require('sinon');
var nock = require('nock');
var c, spy;

describe('Simple test', function () {
	before(function() {
		nock.cleanAll();
	});
	beforeEach(function () {
		nock('http://nockhost').get(uri => uri.indexOf('status') >= 0).times(20).reply(200, 'Yes');
		c = new Crawler({ maxConnections: 10, jquery: false });
	});
	afterEach(function () {
		c = {};
		spy = {};
	});

	it('should run the first readme examples', function (done) {
		// Access to Github might be slow
		this.timeout(6000);
		c.queue({
			uri: 'http://github.com',
			callback: function (err, result, done) {
				expect(err).to.be.null;
				expect(typeof result.body).to.equal('string');

				done();
			}
		});

		c.on('drain', done);
	});

	it('should run the readme examples', function (done) {
		c = new Crawler({
			maxConnections: 10,
			jquery: false,
			callback: function (err, result, done) {
				expect(err).to.be.null;

				done();
			}
		});
		c.on('drain', function () {
			expect(spy.calledTwice).to.be.true;
			done();
		});

		spy = sinon.spy(c, 'queue');
		c.queue('http://nockhost/status/200');
		c.queue('http://nockhost/status/200');
	});

	it('should run the with an array queue', function (done) {
		this.timeout(6000);
		c.queue([{
			uri: 'http://www.github.com',
			jquery: true,
			callback: function (err, result, done) {
				expect(err).to.be.null;
				expect(result.$).not.to.be.null;
				expect(typeof result.body).to.equal('string');
				done();
			}
		}]);

		c.on('drain', done);
	});
});