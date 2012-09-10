var Crawler = require("../../lib/crawler").Crawler;

QUnit.module("simple");

var DEBUG = false;

test("inline html", function() {
    expect( 2 );

    stop();

    var c = new Crawler({
        "debug":DEBUG
    });

    c.queue({
        "html":"<p><i>great!</i></p>",
        "callback":function(error,result,$) {
            equal(error,null);
            equal($("i").html(),"great!");
            start();
        }
    });

});


test("one request", function() {
    expect( 2 );

    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "callback":function(error,result,$) {
            equal(error,null);
            ok(result.body.length>1000);
            start();
        }
    });

    c.queue(["http://google.com/"]);

});

test("two requests", function() {
    expect( 4 );

    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "callback":function(error,result,$) {
            equal(error,null);
            ok(result.body.length>1000);
            
        },
        "onDrain":function() {
            start();
        }
    });

    c.queue(["http://google.com/", "http://google.fr/"]);

});

/* */