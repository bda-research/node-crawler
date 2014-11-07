var Crawler = require('../../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;

describe('Simple test', function() {
    beforeEach(function() {
        c = new Crawler({
            forceUTF8: true
        });
    });
    afterEach(function() {
        c = {};
    });
    it('should run the readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            jquery: true,
            onDrain: function() {
                done();
            },
            callback: function(error, result, $) {
                expect(typeof result.body).to.equal('string');
            }
        });
        c.queue('http://google.com');
    });
    it('should run the with an array queue', function(done) {
        c = new Crawler();
        c.queue([{
            uri: 'http://www.google.com',
            jquery: true,
            callback : function(error,result,$) {
                expect(typeof result.body).to.equal('string');
                done();
            }
        }]);
    });
    it('should work if uri is a function', function(done) {
        var statusCode = 200;
        var uriFunction = function(statusCode) {
            return 'http://'+httpbinHost+'/status/'+statusCode;
        };
        c = new Crawler({
            maxConnections: 10,
            onDrain: function() {
                done();
            },
            callback: function(error, result, $) {
                expect(typeof result.statusCode).to.equal('number');
                expect(result.statusCode).to.equal(statusCode);
            }
        });
        c.queue({
            uri: uriFunction(statusCode)
        });
    });
    it('should work if uri is a function, example from Readme', function(done) {
        var googleSearch = function(search) {
            return 'http://www.google.fr/search?q=' + search;
        };
        c = new Crawler({
            maxConnections: 10,
            onDrain: function() {
                done();
            },
            callback: function(error, result, $) {
                expect(typeof result.statusCode).to.equal('number');
                expect(result.statusCode).to.equal(200);
            }
        });
        c.queue({
            uri: googleSearch('cheese')
        });
    });
});