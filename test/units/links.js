var Crawler = require("../../lib/crawler").Crawler;
var _ = require("underscore");

QUnit.module("links");

var DEBUG = true;
var MOCKPORT = 30045;


test("links resolve to absolute urls", function() {
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
        "uri":"http://127.0.0.1:"+MOCKPORT+"/mockfiles/links1.html",
        "callback":function(error,result,$) {

            var links = _.map($("a"),function(a) {
                return a.href;
            });

            //Both links should be resolve to absolute URLs
            equal(links[0],"http://127.0.0.1:30045/mockfiles/links2.html");
            equal(links[1],"http://127.0.0.1:30045/mockfiles/links2.html");
               
        }
    }]);
    

});
