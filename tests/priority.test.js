/**
 *
 * Priority test
 * 	1st task added expected to execute firstly, ignoring the priority
 * 	following tasks expect to abide the priority
 *
 */
'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var nock = require('nock');
var c;
var spf = [0, 0, 0, 0];
var cnt = 0;

describe('Priority test', function () {
	before(function () {
		nock.cleanAll();
		nock('http://nockHost').get(uri => uri.indexOf('links') >= 0).times(4).reply(200, 'Yes');

		c = new Crawler({
			jquery: false,
			maxConnections: 1
		});

		c.queue([{
			uri: 'http://nockHost/links/0',
			priority: 4,
			callback: function (error, result, done) {

				spf[cnt++] = 3;

				done();
			}
		}]);

		c.queue([{
			uri: 'http://nockHost/links/4',
			priority: 3,
			callback: function (error, result, done) {

				spf[cnt++] = 4;

				done();
			}
		}]);

		c.queue([{
			uri: 'http://nockHost/links/5',
			priority: 2,
			callback: function (error, result, done) {

				spf[cnt++] = 5;

				done();
			}
		}]);

		c.queue([{
			uri: 'http://nockHost/links/6',
			priority: 1,
			callback: function (error, result, done) {

				spf[cnt++] = 6;

				done();
			}
		}]);
	});

	it('should execute in order', function (done) {
		this.timeout(5000);

		setTimeout(function () {
			expect(spf[0]).to.equal(3);
			expect(spf[1]).to.equal(6);
			expect(spf[2]).to.equal(5);
			expect(spf[3]).to.equal(4);
			done();
		}, 1000);
	});
});
