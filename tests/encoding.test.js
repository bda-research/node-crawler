'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
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
});



