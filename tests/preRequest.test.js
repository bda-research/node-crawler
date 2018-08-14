/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const sinon = require('sinon');

// settings for nock to mock http server
const nock = require('nock');

// init variables
let cb;
let crawler;

describe('preRequest feature tests', function() {

	before(function() {
		nock.cleanAll();
		nock('http://test.crawler.com').get('/').reply(200, 'ok').persist();
	});

	beforeEach(function() {
		cb = sinon.spy();
	});

	it('should do preRequest before request when preRequest defined in crawler options', function(finishTest) {
		crawler = new Crawler({
			jQuery: false,
			preRequest: (options, done) => {
				setTimeout(function() {
					cb('preRequest');
					done();
				}, 50);
			}
		});
		crawler.queue({
			uri: 'http://test.crawler.com/',
			callback: (error, response, done) => {
				expect(error).to.be.null;
				expect(cb.getCalls().length).to.equal(1);
				expect(cb.getCalls()[0].args[0]).to.equal('preRequest');
				done();
				finishTest();
			}
		});
	});

	it('should do preRequest before request when preRequest defined in queue options', function(finishTest) {
		crawler = new Crawler({ jQuery: false });
		crawler.queue({
			uri: 'http://test.crawler.com/',
			preRequest: (options, done) => {
				setTimeout(function() {
					cb('preRequest');
					done();
				}, 50);
			},
			callback: (error, response, done) => {
				expect(error).to.be.null;
				expect(cb.getCalls().length).to.equal(1);
				expect(cb.getCalls()[0].args[0]).to.equal('preRequest');
				done();
				finishTest();
			}
		});
	});

	it('preRequest should be executed the same times as request', function(finishTest) {
		crawler = new Crawler({
			jQuery: false,
			rateLimit: 50,
			preRequest: (options, done) => {
				cb('preRequest');
				done();
			},
			callback: (error, response, done) => {
				expect(error).to.be.null;
				cb('callback');
				done();
			}
		});
		const seq = [];
		for(var i = 0; i < 5; i++) {
			crawler.queue('http://test.crawler.com/');
			seq.push('preRequest');
			seq.push('callback');
		}
		crawler.queue({
			uri: 'http://test.crawler.com/',
			preRequest: (options, done) => { done(); },
			callback: (error, response, done) => {
				expect(cb.getCalls().map(c => c.args[0]).join()).to.equal(seq.join());
				done();
				finishTest();
			}
		});
	});

	it('when preRequest fail, should retry three times by default', function(finishTest) {
		crawler = new Crawler({
			jQuery: false,
			rateLimit: 20,
			retryTimeout: 0,
			preRequest: (options, done) => {
				cb('preRequest');
				done(new Error());
			},
			callback: (error, response, done) => {
				expect(error).to.exist;
				expect(cb.getCalls().length).to.equal(4);
				done();
				finishTest();
			}
		});
		crawler.queue('http://test.crawler.com/');
	});

	it('when preRequest fail, should return error when error.op = \'fail\'', function(finishTest) {
		crawler = new Crawler({
			jQuery: false,
			rateLimit: 20,
			retryTimeout: 0,
			preRequest: (options, done) => {
				cb('preRequest');
				const error = new Error();
				error.op = 'fail';
				done(error);
			},
			callback: (error, response, done) => {
				expect(error).to.exist;
				expect(cb.getCalls().length).to.equal(1);
				done();
				finishTest();
			}
		});
		crawler.queue('http://test.crawler.com/');
	});

	it('when preRequest fail, callback should not be called when error.op = \'abort\'', function(finishTest) {
		crawler = new Crawler({
			jQuery: false,
			rateLimit: 20,
			retries: 0,
			preRequest: (options, done) => {
				cb('preRequest');
				let error = new Error();
				error.op = 'abort';
				done(error);
				setTimeout(function() {
					expect(cb.getCalls().length).to.equal(1);
					for (let i = 0; i < cb.getCalls().length; i++) {
						expect(cb.getCalls()[i].args[0]).to.equal('preRequest');
					}
					finishTest();
				}, 100);
			},
			callback: () => {
				expect(null).to.equal(1);
			}
		});
		crawler.queue('http://test.crawler.com/');
	});

	it('when preRequest fail, should put request back in queue when error.op = \'queue\'', function(finishTest) {
		let counter = 0;
		crawler = new Crawler({
			jQuery: false,
			rateLimit: 20,
			preRequest: (options, done) => {
				expect(options.retries).to.equal(3);
				let error = new Error();
				error.op = 'queue';
				if(++counter > 3) {
					expect(cb.getCalls().length).to.equal(3);
					for (let i = 0; i < cb.getCalls().length; i++) {
						expect(cb.getCalls()[i].args[0]).to.equal('preRequest');
					}
					// if error.op not set to abort, the task will continue, test will fail if you have more tests to go other than this
					error.op = 'abort';
					finishTest();
				}
				cb('preRequest');
				done(error);
			},
			callback: () => {
				expect(null).to.equal(1);
			}
		});
		crawler.queue('http://test.crawler.com/');
	});
});