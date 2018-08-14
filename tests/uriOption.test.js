/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const sinon = require('sinon');

// settings for nock to mock http server
const nock = require('nock');

describe('Uri Options', function() {

	before(function() {
		nock.cleanAll();
		nock('http://test.crawler.com').get('/').reply(200, 'ok').persist();
	});

	const crawler = new Crawler({ jQuery: false });

	it('should work if uri is string', function(finishTest) {
		crawler.queue({
			uri: 'http://test.crawler.com/',
			callback: (error, response, done) => {
				expect(error).to.be.null;
				done();
				finishTest();
			}
		});
	});

	it('should work if uri is a function', function(finishTest) {
		function uriFn(onUri) {
			onUri('http://test.crawler.com/');
		}
		crawler.queue({
			uri: uriFn,
			callback: (error, response, done) => {
				expect(error).to.be.null;
				done();
				finishTest();
			}
		});
	});

	it('should skip if the uri is undefined or an empty string', function(finishTest) {
		const push = sinon.spy(crawler, '_pushToQueue');
		crawler.queue([undefined, null, []]);
		crawler.queue({
			uri: 'http://test.crawler.com/',
			callback: (error, response, done) => {
				expect(push.calledOnce).to.be.true;
				done();
				finishTest();
			}
		});
	});
});