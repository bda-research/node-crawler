var Crawler = require('../../lib/crawler').Crawler;
var expect = require('chai').expect;
var DEBUG = true;
var c;
describe("Encoding", function() {
    beforeEach(function() {
        c = new Crawler({
            debug: DEBUG,
            forceUTF8: true
        });
    });
    it('should parse latin-1', function(done) {
        c.queue([{
            uri: 'http://czyborra.com/charsets/iso8859.html',
            callback: function(error, result) {
                expect(error).to.be.null;
                expect(result.body.indexOf('Jörg')).to.be.above(0);
                done();
            }
        }]);
    });
});



