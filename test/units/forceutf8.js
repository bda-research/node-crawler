var Crawler = require("../../lib/crawler").Crawler;

QUnit.module("forceUTF8");

var DEBUG = true;
var MOCKPORT = 30045;

var c = new Crawler({
    "debug":DEBUG,
    "forceUTF8":true
});

test("forceutf8 - from latin-1", function() {
    expect( 2 );
    
    stop();

    c.queue([{
        "uri":"http://czyborra.com/charsets/iso8859.html",
        "callback":function(error,result,$) {
            equal(error,null);
            ok(result.body.indexOf("Jörg")>=0);
            start();
        }
    }]);
    

});

