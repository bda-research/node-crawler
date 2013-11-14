var Crawler = require("../../lib/crawler").Crawler;
var request = require("request");

QUnit.module("jar");

var DEBUG = false;
var MOCKPORT = 30045;


test("jar", function() {
    expect( 2 );

    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "jar": request.jar(),
        "callback":function(error,result,$) {
            equal(error, null);
            ok(result.body.length > 1000);
            start();
        }
    });

    c.queue(["http://google.com/"]);

});
