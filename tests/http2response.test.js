/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
let c;

describe('request body', function () {

	afterEach(function () {
		c = {};
	});

	it('response statusCode', function (finishTest) {
		c = new Crawler({
			retryTimeout: 1000,
			retries: 2,
			jquery: false,
			http2: true
		});

		c.queue({
			uri: 'https://nghttp2.org/httpbin/status/200',
			callback: (error, response, done) => {
				expect(response.statusCode).to.equal(200);
				done();
				finishTest();
			}
		});
	});

	it('response headers', function (finishTest) {
		c = new Crawler({
			retryTimeout: 1000,
			retries: 2,
			jquery: false,
			http2: true
		});

		c.queue({
			uri: 'https://nghttp2.org/httpbin/status/200',
			callback: (error, response, done) => {
				expect(response.headers).to.exist;
				expect(typeof response.headers).to.equal('object');
				expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
				done();
				finishTest();
			}
		});
	});


	it('html response body', function (finishTest) {
		c = new Crawler({
			retryTimeout: 1000,
			retries: 2,
			jquery: true,
			http2: true
		});

		c.queue({
			uri: 'https://nghttp2.org/httpbin/html',
			callback: (error, response, done) => {
				const $ = response.$;
				expect($).to.exist;
				expect(typeof $).to.equal('function');
				expect($('body').length).to.equal(1);

				done();
				finishTest();
			}
		});
	});
});