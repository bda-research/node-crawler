var Crawler = require("../lib/crawler").Crawler;

var c = new Crawler({
    "maxConnections":10,
    "timeout":60,
    "callback":function(error,result,$) {
        $("a").each(function(i,a) {
            console.log(a.href);
            //c.queue(a.href);
        })
    }
});

c.queue(["http://jamendo.com/","http://tedxparis.com"]);
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