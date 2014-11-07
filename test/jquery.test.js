var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var given = require('mocha-testdata');

var httpbinHost = 'localhost:8000';
var c;

describe('Jquery testing', function() {
    afterEach(function() {
        c = {};
    });
    describe('Jquery parsing', function() {
        given.async('jsdom', 'cheerio')
            .it('should work on inline html', function(done, jquery) {
                c = new Crawler();
                c.queue([{
                    html: '<p><i>great!</i></p>',
                    jquery: jquery,
                    callback: function(error, result, $) {
                        expect(error).to.be.null;
                        expect($('i').html()).to.equal('great!');
                        done();
                    }
                }]);
            });
    });
    describe('Jquery injection', function() {
        it('should enable jsdom by default', function(done) {
            c = new Crawler({
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($.fn.jquery).to.equal('1.8.3');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        given.async('jsdom', {name: 'jsdom'}).it('should enable jsdom if set', function(done, jquery) {
            c = new Crawler({
                jquery: jquery,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($.fn.jquery).to.equal('1.8.3');
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
                    expect($.fn).to.be.undefined;
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
        it('should auto-disabling of jQuery if no html tag first', function(done) {
            c = new Crawler({
                jQuery: true,
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
    });
    describe('Cheerio specific test', function() {

    });
});