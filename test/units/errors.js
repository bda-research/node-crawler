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
        "retries":1,
        "onDrain":function() {
            start();
        }
    });

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


test("request statuses", function() {
    expect( 6 );
    
    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "jQuery":false,
        "onDrain":function() {
            start();
        }
    });

    c.queue([{
        "uri":"http://127.0.0.1:"+MOCKPORT+"/status/200",
        "callback":function(error,result,$) {
            equal(error,null);
            equal(result.body,"HTTP 200");
            equal(result.statusCode,200);
        }
    },{
        "uri":"http://127.0.0.1:"+MOCKPORT+"/status/404",
        "callback":function(error,result,$) {
            equal(error,null);
            equal(result.body,"HTTP 404");
            equal(result.statusCode,404);
        }
    }]);
    

});



test("empty response", function() {
    expect( 2 );
    
    stop();

    var c = new Crawler({
        "debug":DEBUG,
        "jQuery":false,
        "onDrain":function() {
            start();
        }
    });

    c.queue([{
        "uri":"http://127.0.0.1:"+MOCKPORT+"/empty",
        "callback":function(error,result,$) {
            equal(error,null);
            equal(result.statusCode,204);
        }
    }/*,{
        "uri":"http://127.0.0.1:"+MOCKPORT+"/close/end",
        "callback":function(error,result,$) {
            ok(!!error);
        }
    }*/]);
    

});
