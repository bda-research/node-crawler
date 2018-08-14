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

describe('Direct feature tests', function() {

	before(function() {
		nock.cleanAll();
		nock('http://test.crawler.com').get('/').reply(200, 'ok').persist();
	});

	beforeEach(function() {
		cb = sinon.spy();
		crawler = new Crawler({ 
			jQuery: false,
			rateLimit: 100,
			preRequest: (options, done) => {
				cb('preRequest');
				done();
			},
			callback: (err, res, done) => {
				if (err) {
					cb('error');
				} else {
					cb('callback');
				}
				done();
			}
		});
		crawler.on('request', () => {
			cb('Event:request');
		});
	});

	it('should not trigger preRequest or callback of crawler instance', function(finishTest) {
		crawler.direct({
			uri: 'http://test.crawler.com/',
			callback: (error, res) => {
				expect(error).to.be.null;
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.equal('ok');
				expect(cb.called).to.be.false;
				finishTest();
			}
		});
	});

	it('should be sent directly regardless of current queue of crawler', function(finishTest) {
		crawler.queue({
			uri: 'http://test.crawler.com/',
			callback: (error, res, done) => {
				expect(error).to.be.null;
				crawler.direct({
					uri: 'http://test.crawler.com/',
					callback: () => {
						expect(cb.getCalls().length).to.equal(2);
						cb('direct');
					}
				});
				done();
			}
		});
		crawler.queue('http://test.crawler.com/');
		crawler.queue('http://test.crawler.com/');
		crawler.queue({
			uri: 'http://test.crawler.com/',
			callback: (error, res, done) => {
				expect(error).to.be.null;
				let seq = ['preRequest','Event:request','direct','preRequest','Event:request','callback','preRequest','Event:request','callback','preRequest','Event:request'];
				expect(cb.getCalls().map(c => c.args[0]).join()).to.equal(seq.join());
				expect(cb.getCalls().length).to.equal(11);
				done();
				finishTest();
			}
		});
	});

	it('should not trigger Event:request by default', function(finishTest) {
		crawler.direct({
			uri: 'http://test.crawler.com/',
			callback: (error, res) => {
				expect(error).to.be.null;
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.equal('ok');
				expect(cb.called).to.be.false;
				finishTest();
			}
		});
	});

	it('should trigger Event:request if specified in options', function(finishTest) {
		crawler.direct({
			uri: 'http://test.crawler.com/',
			skipEventRequest: false,
			callback: (error, res) => {
				expect(error).to.be.null;
				expect(res.statusCode).to.equal(200);
				expect(res.body).to.equal('ok');
				expect(cb.calledOnce).to.be.true;
				expect(cb.firstCall.args[0]).to.equal('Event:request');
				finishTest();
			}
		});
	});
});