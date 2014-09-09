var Crawler = require('../../lib/crawler').Crawler;
var expect = require('chai').expect;
var _ = require('underscore');
var memwatch = require('memwatch');
var httpbinHost = 'localhost:8000';

var c;

describe('Leaks', function() {
    afterEach(function(){
        c = {};
    });
    it('should leak with JSDOM enabled and without autoWindowClose', function(done){

        //disabled mocha timeout for this particular test
        this.timeout(999999999);

        var N = 100;
        var hd;
        c = new Crawler({
            jQuery: true,
            timeout: 500,
            autoWindowClose: false,
            retryTimeout: 1000,
            retries: 1,
            onDrain: function() {
                // Wait a bit for the GC to kick in
                setTimeout(function() {
                    var diff = hd.end();
                    //Should have grown by more than 2 MB.
                    expect(diff.change.size_bytes).to.be.above(2000000);
                    done();
                }, 10000);
            }
        });

        hd = new memwatch.HeapDiff();
        for (var i=0; i<N; i++) {
            c.queue([{
                uri:'http://'+httpbinHost+'/stream/10'+i,
                callback:function(error,result,$) {}
            }]);
        }
    });

    it('should NOT leak with JSDOM disabled, crawling 10k urls', function(done){

        //disabled mocha timeout for this particular test
        this.timeout(999999999);

        var N = 10000;
        var hd;
        c = new Crawler({
            jQuery: false,
            timeout: 500,
            autoWindowClose: false,
            retryTimeout: 1000,
            retries: 1,
            onDrain: function() {
                // Wait a bit for the GC to kick in
                setTimeout(function() {
                    var diff = hd.end();
                    //Should have almost not changed, less then 100kb
                    expect(diff.change.size_bytes).to.be.below(100000);
                    done();
                }, 10000);
            }
        });

        hd = new memwatch.HeapDiff();
        for (var i=0; i<N; i++) {
            c.queue([{
                uri:'http://'+httpbinHost+'/stream/10'+i,
                callback:function(error,result,$) {}
            }]);
        }
    });
});
