
'use strict';

const Crawler = require('../lib/crawler');
const nock = require('nock');

describe('Callback test', function() {
	before(function() {
		nock.cleanAll();
	});
	
	let crawler = null;
	const url = 'http://www.whatever.com';

	beforeEach(() => {
		crawler = new Crawler({
			retryTimeout:0,
			retries:0,
			timeout:100,
			logger: {
				log:() => {}
			},
		});
	});
	
	afterEach(() => {
		crawler = null;
	});
    
	it('should end as expected without callback', function(done) {
		nock(url)
			.get('/get')
			.reply(200, '<html></html>',{
				'Content-Type': 'text/html'
			});
		
		crawler.on('drain', done);
		crawler.queue(`${url}/get`);
	});

	it('should end as expected without callback when timedout', function(done) {
		/*
		 * TODO: request.js claim that it has ETIMEDOUT error which means time spent by the server to send response headers
		 * But the source code reflects the point is `connect` event on socket.
		 */
		nock(url)
			.get('/delay')
			//.delay({head:1000})
			//.delayConnection(5000)
			.delayBody(500)
			//.socketDelay(2000)
			.reply(200, '<html></html>',{
				'Content-Type': 'text/html'
			});

		crawler.on('drain', done);
		crawler.queue(`${url}/delay`);
	});
    
	it('should end as expected without callback when encoding error', function(done) {
		nock(url)
			.get('/get')
			.reply(200, '<html></html>',{
				'Content-Type': 'text/html'
			});

		crawler._doEncoding = function(){throw new Error('Error for testing.');};
		crawler.on('drain', done);
		crawler.queue(`${url}/get`);
	});
});
