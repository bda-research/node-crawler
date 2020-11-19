/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
let c;

describe('request body', function () {
	before(function () {
		console.log('before all test start');
	});

	afterEach(function () {
		c = {};
	});

	it('form is string without content-type setting', function (done) {
		c = new Crawler({});

		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			form: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
			},
			http2: true,
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);

		expect(typeof requestBody).to.equal('string');
		expect(/^application\/x-www-form-urlencoded\b/.test(testOptions.headers['content-type'])).to.be.true;
		done();
	});

	it('form is an object with no content-type in header', function (done) {
		c = new Crawler({});

		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			form: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
			},
			http2: true,
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);

		expect(typeof requestBody).to.equal('string');
		expect(/^application\/x-www-form-urlencoded\b/.test(testOptions.headers['content-type'])).to.be.true;
		done();
	});

	it('form is object with application/x-www-form-urlencoded content-type in header', function (done) {
		c = new Crawler({});

		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			form: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
				'content-type': 'application/x-www-form-urlencoded'
			},
			http2: true,
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);

		expect(typeof requestBody).to.equal('string');
		expect(/^application\/x-www-form-urlencoded\b/.test(testOptions.headers['content-type'])).to.be.true;
		done();
	});

	it('json is true with no content-type in header', function (done) {
		c = new Crawler({});

		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			body: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
			},
			json: true,
			http2: true
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);

		expect(typeof requestBody).to.equal('string');
		expect(/^application\/json\b/.test(testOptions.headers['content-type'])).to.be.true;
		done();
	});

	it('default json setting(false) without content-type in header', function (done) {
		c = new Crawler({});

		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			body: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
			},
			http2: true
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);
		expect(typeof requestBody).to.equal('object');
		expect(testOptions.headers['conetent-type'] === undefined).to.be.true;
		done();
	});

	it('wild card content type with defulat json setting', function (done) {
		c = new Crawler({});
		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'POST',
			body: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
				'content-type': 'test-wild-card'
			},
			http2: true
		};

        
		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));
		const requestBody = c.generateHttp2RequestBody(testOptions);
		expect(typeof requestBody).to.equal('object');
		expect(testOptions.headers['content-type'] === 'test-wild-card').to.be.true;
		done();
	});

	it('GET method has no request body', function (done) {
		c = new Crawler({});
		const testOptions = {
			uri: 'https://www.whatEver.com',
			method: 'GET',
			body: {
				a: 'value a',
				b: 'value b'
			},
			headers: {
				'accept-language': 'zh-cn',
				'content-type': 'test-wild-card'
			},
			http2: true
		};

		testOptions.headers = Object.assign(testOptions.headers, c.generateHttp2RequestLine(testOptions));

        
		const requestBody = testOptions.headers[':method'] === 'GET' ? null : c.generateHttp2RequestBody(testOptions);
		expect(requestBody).to.equal(null);
		done();
	});
});