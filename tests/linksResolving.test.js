'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var _ = require('lodash');
var jsdom = require('jsdom');
var httpbinHost = 'localhost:8000';
var c;

describe('Links', function() {
    beforeEach(function() {
        c = new Crawler({
            forceUTF8: true,
            jquery: jsdom
        });
    });
    it('should resolved links to absolute urls with jsdom', function(done) {
        c.queue([{
            uri : 'http://'+httpbinHost+'/links/3/0',
            callback: function(error, result, $) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {

                var links = _.map($('a'), function(a) {
                    return a.href;
                });
                //Both links should be resolve to absolute URLs
                expect(links[0]).to.equal('http://'+httpbinHost+'/links/3/1');
                expect(links[1]).to.equal('http://'+httpbinHost+'/links/3/2');
                expect(error).to.be.null;
                done();
            }
        }]);
    });
    it('should resolved links to absolute urls after redirect with jsdom', function(done) {
        c.queue([{
            uri : 'http://'+httpbinHost+'/redirect-to?url=http://example.com/',
            callback: function(error, result) {

                expect(result.uri).to.equal('http://example.com/');
                expect(error).to.be.null;
                done();
            }
        }]);
    });
});