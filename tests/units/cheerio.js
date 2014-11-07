var Crawler = require('../../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;

describe('Cheerio test', function() {
    describe('html options', function() {
        beforeEach(function() {
            c = new Crawler({
                forceUTF8: true,
                jQuery: 'cheerio'
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
});