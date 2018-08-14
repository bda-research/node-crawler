/*jshint expr:true */

'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const nock = require('nock');

describe('Request tests', function() {
	before(function() {
		nock.cleanAll();
	});
	
	let crawler = null;
	let scope = null;	
	const origin = 'http://www.whatever.com';
	const path = '/get';
	const headerPath = '/header';
	
	beforeEach(function() {
		crawler = new Crawler({
			retries: 0,
			json: true,
			jQuery: false,
		});
		
		scope = nock(origin).get(path).reply(200).persist();
		nock(origin).get(headerPath).reply(function(){
			return [200, this.req.headers, { 'Content-Type': 'application/json' }];
		});
	});
	
	afterEach(function() {
		scope.persist(false);
		crawler = null;
	});
	
	it('should crawl one request', function(end) {
		crawler.queue({uri: `${origin}${path}`, callback: (error, res, done) => {
			expect(error).to.be.null;
			expect(res.statusCode).to.eql(200);
			done();
			end();
		}});
	});
	
	it('should crawl two request request and execute the onDrain() callback', function(done) {
		const callback = function(error, res,next) {
			expect(error).to.be.null;
			expect(res.statusCode).to.eql(200);
			next();
		};
		
		crawler.on('drain',done);
		
		crawler.queue({
			uri: `${origin}${path}`,
			callback: callback
		});

		crawler.queue({
			uri: `${origin}${path}`,
			callback: callback
		});
	});
	
	it('should contain gzip header', function(end) {
		crawler.queue({uri: `${origin}${headerPath}`, callback:function(error, res, done) {
			expect(error).to.be.null;
			expect(res.body['accept-encoding']).to.match(/gzip/);
			done();
			end();
		}});
	});
	
	it('should use the provided user-agent', function(end) {
		const ua = 'test/1.2';
		crawler.queue({
			uri: `${origin}${headerPath}`, 
			userAgent: ua,
			callback:function(error, res, done) {
				expect(error).to.be.null;
				expect(res.body['user-agent']).to.eql(ua);
				done();
				end();
			}
		});
	});
	
	it('should replace the global User-Agent', function(end) {
		crawler = new Crawler({
			headers:{'User-Agent': 'test/1.2'},
			jQuery: false,
			json: true,
			callback:function(error, res, done) {
				expect(error).to.be.null;
				expect(res.body['user-agent']).to.equal('foo/bar');
				done();
				end();
			}
		});
		
		crawler.queue({uri: `${origin}${headerPath}`,headers:{'User-Agent': 'foo/bar'}});
	});
	
	it('should replace the global userAgent', function(end) {
		crawler = new Crawler({
			userAgent: 'test/1.2',
			jQuery: false,
			json: true,
			callback:function(error, res, done) {
				expect(error).to.be.null;
				expect(res.body['user-agent']).to.equal('foo/bar');
				done();
				end();
			}
		});
		
		crawler.queue({uri: `${origin}${headerPath}`, userAgent: 'foo/bar'});
	});
	
	it('should spoof the referer', function(end) {
		const referer = 'http://spoofed.com';
		
		crawler.queue({
			uri: `${origin}${headerPath}`,
			referer: referer,
			callback:function(error, res, done) {
				expect(error).to.be.null;
				expect(res.body.referer).to.equal(referer);
				done();
				end();
			} 
		});
	});
});
