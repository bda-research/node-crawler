/*jshint expr:true */
'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const map = require('lodash/map');
const jsdom = require('jsdom');

// settings for nock to mock http server
const nock = require('nock');

describe('Links', function() {

	before(function() {
		nock.cleanAll();
		nock('http://test.crawler.com').get('/pagination').reply(200, '<html><head><meta charset="utf-8"><title>Links</title></head><body><a href="/page/1">1</a> <a href="/page/2">2</a></body></html>', { 'Content-Type': 'text/html' }).persist();
		nock('http://test.crawler.com').get('/redirect').reply(302, 'redirect', { 'Location': 'http://test.crawler.com/pagination' }).persist();        
	});

	const crawler = new Crawler({ jquery: jsdom });

	it('should resolved links to absolute urls with jsdom', function(finishTest) {
		crawler.queue({
			uri: 'http://test.crawler.com/pagination',
			callback: (error, response, done) => {
				expect(error).to.be.null;
				const links = map(response.$('a'), (a) => {
					return a.href;
				});
				expect(links[0]).to.equal('http://test.crawler.com/page/1');
				expect(links[1]).to.equal('http://test.crawler.com/page/2');
				done();
				finishTest();
			}
		});
	});

	it('should resolved links to absolute urls after redirect with jsdom', function(finishTest) {
		crawler.queue({
			uri: 'http://test.crawler.com/redirect',
			callback: (error, response, done) => {
				expect(error).to.be.null;
				expect(response.request.uri.href).to.equal('http://test.crawler.com/pagination');
				done();
				finishTest();
			}
		});
	});
});