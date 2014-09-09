var Crawler = require('../../lib/crawler').Crawler;
var expect = require('chai').expect;
var httpbinHost = 'httpbin.org';
var c;

describe('Simple test', function() {
    describe('html options', function() {
        beforeEach(function() {
            c = new Crawler({
                forceUTF8: true
            });
        });
        it('should work on inline html', function(done) {
            c.queue([{
                html: '<p><i>great!</i></p>',
                callback: function(error, result, $) {
                    expect(error).to.be.null;
                    expect($('i').html()).to.equal('great!');
                    done();
                }
            }]);
        });
    });
    describe('simple requests', function() {
        afterEach(function() {
            c = {};
        });
        it('should crawl one request', function(done) {
            c = new Crawler({
                callback: function(error, result, $) {
                    expect(error).to.be.null;
                    expect(result.statusCode).to.equal(200);
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/status/200']);
        });
        it('should crawl two request request and execute the onDrain() callback', function(done) {
            c = new Crawler({
                callback: function(error, result, $) {
                    expect(error).to.be.null;
                    expect(result.body.length).to.be.above(1000);
                },
                onDrain: function() {
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/html', 'http://'+httpbinHost]);
        });
        it('should parse a gzip response', function(done) {
            c = new Crawler({
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect(result.body.indexOf('User-Agent')).to.be.above(0);
                    expect(result.headers['content-encoding']).to.equal('gzip');
                    done();
                }
            });
            c.queue(['http://httpbin.org/gzip']);
        });
        it('should use the provided user-agent', function(done) {
            c = new Crawler({
                userAgent: 'test/1.2',
                jQuery: false,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    try {
                        var body = JSON.parse(result.body);
                    } catch (ex) {
                        expect(false).to.be.true;
                    }
                     expect(body['user-agent']).to.equal('test/1.2');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/user-agent']);
        });
        it('should spoof the referer', function(done) {
            c = new Crawler({
                referer: 'http://spoofed.com',
                jQuery: false,
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    try {
                        var body = JSON.parse(result.body);
                    } catch (ex) {
                        expect(false).to.be.true;
                    }
                    expect(body['headers']['Referer']).to.equal('http://spoofed.com');
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/headers']);
        });
        it('should enable jQuery by default', function(done) {
            c = new Crawler({
                callback:function(error, result, $) {
                    expect(error).to.be.null;
                    expect($).not.to.be.null;
                    done();
                }
            });
            c.queue(['http://'+httpbinHost+'/']);
        });
        it('should disable jQuery', function(done) {
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
        it('should run the readme examples', function(done) {
            c = new Crawler({
                maxConnections: 10,
                onDrain: function() {
                    done();
                },
                callback: function(error, result, $) {
                    expect(typeof result.body).to.equal('string');
                }
            });
            c.queue('http://google.com');
        });
    })
});