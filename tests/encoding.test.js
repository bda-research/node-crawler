'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;

describe('Encoding', function() {
    beforeEach(function() {
        c = new Crawler({
            forceUTF8: true
        });
    });
    it('should parse latin-1', function(done) {
        this.timeout(5000);
        c.queue([{
            uri: 'http://czyborra.com/charsets/iso8859.html',
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                expect(result.body.indexOf('Jörg')).to.be.above(0);
                done();
            }
        }]);
    });
    it('should return buffer if encoding = null', function(done) {
        this.timeout(5000);
        c.queue([{
            uri: 'http://' + httpbinHost + '/html',
            encoding:null,
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                expect(result.body instanceof Buffer).to.be.true;
                done();
            }
        }]);
    });
    it('should parse latin-1 if incomingEncoding = ISO-8859-1', function(done) {
        this.timeout(5000);
        c.queue([{
            uri: 'http://czyborra.com/charsets/iso8859.html',
            incomingEncoding: 'ISO-8859-1',
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                expect(result.body.indexOf('Jörg')).to.be.above(0);
                done();
            }
        }]);
    });
    it('could not parse latin-1 if incomingEncoding = gb2312', function(done) {
        this.timeout(5000);
        c.queue([{
            uri: 'http://czyborra.com/charsets/iso8859.html',
            incomingEncoding: 'gb2312',
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                expect(result.body.indexOf('Jörg')).to.equal(-1);
                done();
            }
        }]);
    });

    it('should parse charset from header ', function(done) {
        c.queue([{
            uri: 'http://' + httpbinHost + '/html',
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
                done();
            }
        }]);
    });

    it('should parse charset from meta tag in html if header does not contain content-type key ', function(done) {
        c.queue([{
            uri: 'http://czyborra.com/charsets/iso8859.html',
            callback: function(error, result) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                expect(error).to.be.null;
		expect(result.body.indexOf('Jörg')).to.be.above(0);
                done();
            }
        }]);
    });
});



