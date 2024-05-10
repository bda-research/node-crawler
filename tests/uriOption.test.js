/*jshint expr:true */
'use strict';

import Crawler from '../dist/index.js';
import { expect } from 'chai';
import sinon from 'sinon';

// settings for nock to mock http server
import nock from 'nock';

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
		const push = sinon.spy(crawler, '_schedule');
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