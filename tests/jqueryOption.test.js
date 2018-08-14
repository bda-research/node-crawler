/*jshint expr:true */
'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var given = require('mocha-testdata');
var jsdom = require('jsdom');
var c;

describe('Jquery testing', function() {
	afterEach(function() {
		c = {};
	});
	describe('Jquery parsing', function() {
		given.async(jsdom, 'cheerio','whacko')
			.it('should work on inline html', function(done, jquery) {
				c = new Crawler();
				c.queue([{
					html: '<p><i>great!</i></p>',
					jquery: jquery,
					callback: function(error, res) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
					{
						expect(error).to.be.null;
						expect(res.$('i').html()).to.equal('great!');
						done();
					}
				}]);
			});
	});
	describe('Jquery injection', function() {
		it('should enable cheerio by default', function(done) {
			c = new Crawler({
				html: '<p><i>great!</i></p>',
				jquery: true,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{html: '<p><i>great!</i></p>'}]);
		});
		given.async(jsdom).it('should enable jsdom if set', function(done, jquery) {
			c = new Crawler({
				jquery: jquery,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{
				html: '<p><i>great!</i></p>',
			}]);
		});
		given.async('cheerio', {name: 'cheerio'}).it('should enable cheerio if set', function(done, jquery) {
			c = new Crawler({
				jquery: jquery,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{ html: '<p><i>great!</i></p>'}]);
		});
		it('should enable whacko if set',function(done){
			c = new Crawler({
				jquery: 'whacko',
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{html: '<p><i>great!</i></p>'}]);
		});
		it('should disable jQuery if set to false', function(done) {
			c = new Crawler({
				jQuery: false,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$).to.be.empty;
					done();
				}
			});
			c.queue([{html: '<p><i>great!</i></p>' }]);
		});
		given.async('trucmuch', null, undefined).it('should not inject jquery', function(done, jquery) {
			c = new Crawler({
				jquery: jquery,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$).to.be.undefined;
					done();
				}
			});
			c.queue([{html: '<p><i>great!</i></p>' }]);
		});
		given.async('cheerio', jsdom).it('should also enable jQuery even if body is empty, to prevent `$ is not a function` error', function(done, jquery) {
			c = new Crawler({
				jQuery: jquery,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{ html: '<p><i>great!</i></p>'}]);
		});
		given.async('cheerio', jsdom).it('should disable jQuery if body is not text/html ', function(done, jquery) {
			c = new Crawler({
				jQuery: jquery,
				callback:function(error, res) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					done();
				}
			});
			c.queue([{html: '<p><i>great!</i></p>'}]);
		});
		it('should work if jquery is set instead of jQuery when building Crawler', function(done) {
			c = new Crawler({
				maxConnections: 10,
				jquery: true,
				callback: function(error, res,next) {
					expect(res.$).not.to.be.undefined;
					expect(res.options.jQuery).to.be.true;
					expect(res.options.jquery).to.be.undefined;
					next();
				}
			});

			c.on('drain',done);
			c.queue([{ html: '<p><i>great!</i></p>' }]);
		});
		it('should work if jquery is set instead of jQuery when queuing', function(done) {
			c = new Crawler({
				maxConnections: 10,
				jQuery: true,
				callback: function(error, res,next) {
					expect(res.$).to.be.undefined;
					expect(res.options.jQuery).to.be.false;
					next();
				}
			});

			c.on('drain',done);
			c.queue([{
				html: '<p><i>great!</i></p>',
				jquery: false
			}]);
		});
		it('should not inject jquery if jquery is set to undefined', function(done) {
			c = new Crawler({
				maxConnections: 10,
				jquery: undefined,
				callback: function(error, res,next) {
					expect(res.$).to.be.undefined;
					expect(res.options.jQuery).to.be.undefined;
					next();
				}
			});

			c.on('drain',done);
			c.queue([{ html: '<p><i>great!</i></p>'}]);
		});
	});
	describe('Cheerio specific test', function() {
		it('should inject cheerio with options', function(done) {
			var cheerioConf = {
				name: 'cheerio',
				options: {
					normalizeWhitespace: true,
					xmlMode: true
				}
			};
			c = new Crawler({
				maxConnections: 10,
				jquery: cheerioConf,
				callback: function(error, res,next) {
					expect(error).to.be.null;
					expect(res.$('i').html()).to.equal('great!');
					next();
				}
			});

			c.on('drain',done);
			c.queue([{html: '<p><i>great!</i></p>'}]);
		});
	});
});
