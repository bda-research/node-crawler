/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const jsdom = require('jsdom');

// settings for nock to mock http server
const nock = require('nock');

describe('Errors', function() {

	before(function() {
		nock.cleanAll();
		nock('http://test.crawler.com').get('/delay/1').delay(1000).reply(200, 'ok').persist();
		nock('http://test.crawler.com').get('/status/400').reply(400, 'Bad Request').persist();
		nock('http://test.crawler.com').get('/status/401').reply(401, 'Unauthorized').persist();
		nock('http://test.crawler.com').get('/status/403').reply(403, 'Forbidden').persist();
		nock('http://test.crawler.com').get('/status/404').reply(404, 'Not Found').persist();
		nock('http://test.crawler.com').get('/status/500').reply(500, 'Internal Error').persist();
		nock('http://test.crawler.com').get('/status/204').reply(204, '').persist();
	});

	describe('timeout', function() {
		const crawler = new Crawler({
			timeout: 500,
			retryTimeout: 1000,
			retries: 2,
			jquery: false
		});

		it('should retry after timeout', function(finishTest) {
			this.timeout(10000);
			let options = {
				uri: 'http://test.crawler.com/delay/1',
				callback: (error, response, done) => {
					expect(error).to.exist;
					expect(response.options.retries).to.equal(0);
					done();
					finishTest();
				}
			};
			crawler.queue(options);
			expect(options.retries).to.equal(2);
		});

		it('should return a timeout error after ~2sec', function(finishTest) {
			this.timeout(10000);
			crawler.queue({
				uri: 'http://test.crawler.com/delay/1',
				callback: (error, response, done) => {
					expect(error).to.exist;
					expect(error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT').to.be.true;
					done();
					finishTest();
				}
			});
		});
	});

	describe('error status code', function() {
		const crawler = new Crawler({ jQuery : false });
        
		it('should not return an error on status code 400 (Bad Request)', function(finishTest) {
			crawler.queue({
				uri: 'http://test.crawler.com/status/400',
				callback: (error, response, done) => {
					expect(error).to.be.null;
					expect(response.statusCode).to.equal(400);
					done();
					finishTest();
				}
			});
		});

		it('should not return an error on status code 401 (Unauthorized)', function(finishTest) {
			crawler.queue({
				uri: 'http://test.crawler.com/status/401',
				callback: (error, response, done) => {
					expect(error).to.be.null;
					expect(response.statusCode).to.equal(401);
					done();
					finishTest();
				}
			});
		});

		it('should not return an error on status code 403 (Forbidden)', function(finishTest) {
			crawler.queue({
				uri: 'http://test.crawler.com/status/403',
				callback: (error, response, done) => {
					expect(error).to.be.null;
					expect(response.statusCode).to.equal(403);
					done();
					finishTest();
				}
			});
		});

		it('should not return an error on a 404', function(finishTest) {
			crawler.queue({
				uri : 'http://test.crawler.com/status/404',
				callback : (error, response, done) => {
					expect(error).to.be.null;
					expect(response.statusCode).to.equal(404);
					done();
					finishTest();
				}
			});
		});

		it('should not return an error on a 500', function(finishTest) {
			crawler.queue({
				uri : 'http://test.crawler.com/status/500',
				callback : (error, response, done) => {
					expect(error).to.be.null;
					expect(response.statusCode).to.equal(500);
					done();
					finishTest();
				}
			});
		});

		it('should not failed on empty response', function(finishTest) {
			crawler.queue({
				uri : 'http://test.crawler.com/status/204',
				callback : (error, response, done) => {
					expect(error).to.be.null;
					done();
					finishTest();
				}
			});
		});

		it('should not failed on a malformed html if jquery is false', function(finishTest) {
			crawler.queue({
				html : '<html><p>hello <div>dude</p></html>',
				callback : (error, response, done) => {
					expect(error).to.be.null;
					expect(response).not.to.be.null;
					done();
					finishTest();
				}
			});
		});

		it('should not return an error on a malformed html if jQuery is jsdom', function(finishTest) {
			crawler.queue({
				html : '<html><p>hello <div>dude</p></html>',
				jQuery : jsdom,
				callback : (error, response, done) => {
					expect(error).to.be.null;
					expect(response).not.to.be.undefined;
					done();
					finishTest();
				}
			});
		});
	});
});