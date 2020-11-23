/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;

describe('Errors', function () {
	
	afterEach(function () {
	});

	describe('timeout', function () {
		const crawler = new Crawler({
			timeout: 3000,
			retryTimeout: 1000,
			retries: 2,
			jquery: false,
			http2: true
		});

		it('should retry after timeout', function(finishTest) {
			let options = {
				uri: 'https://nghttp2.org/httpbin/delay/4',
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

		it('should return a timeout error after ~9sec', function(finishTest) {
			crawler.queue({
				uri: 'https://nghttp2.org/httpbin/delay/4',
				callback: (error, response, done) => {
					expect(error).to.exist;
					expect(error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT').to.be.true;
					done();
					finishTest();
				}
			});
		});
	});

	describe('error status code', function () {
		const crawler = new Crawler({
			retryTimeout: 1000,
			retries: 2,
			jquery: false,
			http2: true
		});         

		it('should not return an error on status code 400 (Bad Request)', function(finishTest) {
			crawler.queue({
				uri: 'http://nghttp2.org/httpbin/status/400',
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
				uri: 'http://nghttp2.org/httpbin/status/401',
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
				uri: 'http://nghttp2.org/httpbin/status/403',
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
				uri : 'http://nghttp2.org/httpbin/status/404',
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
				uri : 'http://nghttp2.org/httpbin/status/500',
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
				uri : 'http://nghttp2.org/httpbin/status/200',
				callback : (error, response, done) => {
					expect(error).to.be.null;
					done();
					finishTest();
				}
			});
		});
	});


});