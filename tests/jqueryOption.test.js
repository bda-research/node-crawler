'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var given = require('mocha-testdata');
var path = require('path');
var jsdom = require('jsdom');

var httpbinHost = 'localhost:8000';
var c;

describe('Jquery testing', function() {
    afterEach(function() {
        c = {};
    });
    describe('Jquery parsing', function() {
        given.async(jsdom, 'cheerio')
            .it('should work on inline html', function(done, jquery) {
                c = new Crawler();
                c.queue([{
                    html: '<p><i>great!</i></p>',
                    jquery: jquery,
                    callback: function(error, result, $) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
                    {
                        expect(error).to.be.null;
                        expect($('i').html()).to.equal('great!');
                        done();
                    }
                }]);
            });
    });
    describe('Jquery injection', function() {
        it('should enable cheerio by default', function(done) {
            c = new Crawler({
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect(typeof $).to.equal('function');
                    expect(typeof $.root).to.equal('function');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        given.async(jsdom).it('should enable jsdom if set', function(done, jquery) {
            c = new Crawler({
                jquery: jquery,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($.fn.jquery).to.equal('2.1.1');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        given.async('cheerio', {name: 'cheerio'}).it('should enable cheerio if set', function(done, jquery) {
            c = new Crawler({
                jquery: jquery,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect(typeof $).to.equal('function');
                    expect(typeof $.root).to.equal('function');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        it('should disable jQuery if set to false', function(done) {
            c = new Crawler({
                jQuery: false,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($).to.be.undefined;
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        given.async('trucmuch', null, undefined).it('should not inject jquery', function(done, jquery) {
            c = new Crawler({
                jquery: jquery,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($).to.be.undefined;
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        given.async('cheerio', jsdom).it('should auto-disable jQuery if no html tag first', function(done, jquery) {
            c = new Crawler({
                jQuery: jquery,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($).to.be.undefined;
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/status/200']);
        });
        it('should work if jquery is set instead of jQuery when building Crawler', function(done) {
            c = new Crawler({
                maxConnections: 10,
                jquery: true,
                onDrain: function() {
                    done();
                },
                callback: function(error, result, $) {
                    expect($).not.to.be.undefined;
                    expect(result.options.jQuery).to.be.true;
                    expect(result.options.jquery).to.be.undefined;
                }
            });
            c.queue(['http://'+httpbinHost]);
        });
        it('should work if jquery is set instead of jQuery when queuing', function(done) {
            c = new Crawler({
                maxConnections: 10,
                jQuery: true,
                onDrain: function() {
                    done();
                },
                callback: function(error, result, $) {
                    expect($).to.be.undefined;
                    expect(result.options.jQuery).to.be.false;
                }
            });
            c.queue([
                {
                    uri: 'http://'+httpbinHost,
                    jquery : false
                }
            ]);
        });
        it('should not inject jquery if jquery is set to undefined', function(done) {
            c = new Crawler({
                maxConnections: 10,
                jquery: undefined,
                onDrain: function() {
                    done();
                },
                callback: function(error, result, $) {
                    expect($).to.be.undefined;
                    expect(result.options.jQuery).to.be.undefined;
                }
            });
            c.queue(['http://'+httpbinHost]);
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
                onDrain: function() {
                    done();
                },
                callback: function(error, result, $) {
                    expect($._options.normalizeWhitespace).to.be.true;
                    expect($._options.xmlMode).to.be.true;
                    // check if the default value of decodeEntities is still true
                    expect($._options.decodeEntities).to.be.true;
                }
            });
            c.queue(['http://'+httpbinHost]);
        });
    });
});
