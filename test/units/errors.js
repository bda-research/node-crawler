var Crawler = require("../../lib/crawler").Crawler;

QUnit.module("errors");

var DEBUG = false;
var MOCKPORT = 30045;


test("request timeout", function() {
    expect( 2 );
    
    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "timeout":500,
        "retryTimeout":1000,
        "retries":1
    });

    c.onDrain = function() {
        start();
    };

    c.queue([{
        "uri":"http://127.0.0.1:"+MOCKPORT+"/timeout?timeout=100",
        "callback":function(error,result,$) {
            equal(error,null);
        }
    },{
        "uri":"http://localhost:"+MOCKPORT+"/timeout?timeout=600",
        "callback":function(error,result,$) {
            ok(!!error);
        }
    }]);
    

});

