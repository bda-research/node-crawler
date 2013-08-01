var Crawler = require("../../lib/crawler").Crawler;
var _ = require("underscore");
var memwatch = require("memwatch");


QUnit.module("links");

var DEBUG = false;
var MOCKPORT = 30045;


test("Crawl 10k URLs and check memory/speed without jsdom", function() {
    expect( 1 );

    var N = 10000;

    var hd;

    stop();

    var c = new Crawler({
        "debug":false,
        "jQuery":false,
        "timeout":500,
        "retryTimeout":1000,
        "retries":1,
        "onDrain":function() {

            // Wait a bit for the GC to kick in
            setTimeout(function() {
                var diff = hd.end();

                //console.log(JSON.stringify(diff,null,4));

                start();
                console.log("Bytes added to memory",diff.change.size_bytes);

                //Shouldn't have grown by more than 10 MB.
                ok(diff.change.size_bytes<10000000);
            },10000);


        }
    });

    hd = new memwatch.HeapDiff();

    console.log("Queueing "+N+" requests w/o jsdom...");
    for (var i=0;i<N;i++) {
        c.queue([{
            "uri":"http://127.0.0.1:"+MOCKPORT+"/bigpage?i="+i,
            "callback":function(error,result,$) {

            }
        }]);
    }


});

/* Disabled for now, seems jsdom is still leaking under some configurations
test("Crawl 500 URLs and check memory/speed with jsdom", function() {
    expect( 1 );

    var N = 500;

    var hd;

    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "jQuery":true,
        "timeout":500,
        "retryTimeout":1000,
        "retries":1,
        "onDrain":function() {

            // Wait a bit for the GC to kick in
            setTimeout(function() {
                var diff = hd.end();

                //console.log(JSON.stringify(diff,null,4));

                start();
                console.log("Bytes added to memory",diff.change.size_bytes);

                //Shouldn't have grown by more than 20 MB.
                ok(diff.change.size_bytes<20000000);
            },30000);


        }
    });

    hd = new memwatch.HeapDiff();

    console.log("Queueing "+N+" requests w/ jsdom...");
    for (var i=0;i<N;i++) {
        c.queue([{
            "uri":"http://127.0.0.1:"+MOCKPORT+"/bigpage?i="+i,
            "callback":function(error,result,$) {
            }
        }]);
    }


});
*/


test("Check that we do leak w/ 100 jsdom requests without autoWindowClose", function() {
    expect( 1 );

    var N = 100;

    var hd;

    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "jQuery":true,
        "timeout":500,
        "autoWindowClose":false,
        "retryTimeout":1000,
        "retries":1,
        "onDrain":function() {

            // Wait a bit for the GC to kick in
            setTimeout(function() {
                var diff = hd.end();

                //console.log(JSON.stringify(diff,null,4));

                start();
                console.log("Bytes added to memory",diff.change.size_bytes);

                //Should have grown by more than 50 MB.
                ok(diff.change.size_bytes>50000000);
            },10000);


        }
    });

    hd = new memwatch.HeapDiff();

    console.log("Queueing "+N+" requests w/ jsdom and autoWindowClose=false...");
    for (var i=0;i<N;i++) {
        c.queue([{
            "uri":"http://127.0.0.1:"+MOCKPORT+"/bigpage?i="+i,
            "callback":function(error,result,$) {

            }
        }]);
    }


});
