/*jshint expr:true */

'use strict';

const Crawler = require('../lib/crawler');
const expect = require('chai').expect;
const nock = require('nock');

describe('Encoding', function() {
	before(function() {
		nock.cleanAll();
	});

	const origin = 'http://czyborra.com';
	const encodingFileName = 'iso8859.html';
	const charsetName = 'ISO-8859-1';
	const path = `/charsets/${encodingFileName}`;
	const url = `${origin}${path}`;
	const pathWithoutCharsetHeader = `/charsets-noheader/${encodingFileName}`;
	const urlWithoutCharsetHeader = `${origin}${pathWithoutCharsetHeader}`;
	
	let crawler = null;
	
	beforeEach(function() {
		crawler = new Crawler({
			retries: 0,
		});
		
		nock(origin).get(path).replyWithFile(200, `${__dirname}/${encodingFileName}`, { 'Content-Type': `text/html;charset=${charsetName}` });
		nock(origin).get(pathWithoutCharsetHeader).replyWithFile(200, `${__dirname}/${encodingFileName}`, { 'Content-Type': 'text/html' });
	});
	
	it('should parse latin-1', function(done) {
		crawler.queue([{
			uri: url,
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.charset).to.eql(charsetName);
				expect(result.body.indexOf('Jörg')).to.be.above(0);
				done();
			}
		}]);
	});
	
	it('should return buffer if encoding = null', function(done) {
		crawler.queue([{
			uri: url,
			encoding:null,
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.body instanceof Buffer).to.be.true;
				done();
			}
		}]);
	});
	
	it('should parse latin-1 if incomingEncoding = ISO-8859-1', function(done) {
		crawler.queue([{
			uri: url,
			incomingEncoding: charsetName,
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.charset).to.eql(charsetName);
				expect(result.body.indexOf('Jörg')).to.be.above(0);
				done();
			}
		}]);
	});
	
	it('could not parse latin-1 if incomingEncoding = gb2312', function(done) {
		crawler.queue([{
			uri: url,
			incomingEncoding: 'gb2312',
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.body.indexOf('Jörg')).to.equal(-1);
				done();
			}
		}]);
	});

	it('should parse charset from header ', function(done) {
		crawler.queue([{
			uri: url,
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.charset).to.equal(charsetName);
				expect(result.body.indexOf('Jörg')).to.be.above(0);
				done();
			}
		}]);
	});

	it('should parse charset from meta tag in html if header does not contain content-type key ', function(done) {
		crawler.queue([{
			uri: urlWithoutCharsetHeader,
			callback: function(error, result) {
				expect(error).to.be.null;
				expect(result.charset).to.equal(charsetName);
				expect(result.body.indexOf('Jörg')).to.be.above(0);
				done();
			}
		}]);
	});
});



