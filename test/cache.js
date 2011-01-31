var Crawler = require("../lib/crawler").Crawler;

var c = new Crawler({
    "maxConnections":1,
    "timeout":60,
    "debug":true,
    "cache":true,
    "callback":function(error,result,$) {
        $("a").each(function(i,a) {
            console.log(a.href);
        })
    }
});

c.queue(["http://joshfire.com/","http://joshfire.com/","http://joshfire.com/","http://joshfire.com/"]);

/*
c.queue([{
    "uri":"http://parisjs.org/register",
    "method":"POST",
    "timeout":120,
    "callback":function(error,result,$) {
        $("div:contains(Thank you)").after(" very much");
    }
}]);
*/