node-crawler
------------

How to install
 $ npm install crawler

Why / What ?
------------

For now just check my lightning talk : http://www.slideshare.net/sylvinus/web-crawling-with-nodejs

Help & Forks welcomed! This is just starting for now


API ideas
---------

 var Crawler = require("node-crawler").Crawler;
 
 var c = new Crawler({
     "maxConnections":10,
     "timeout":60,
     "callback":function(error,result,$) {
         $("#content a:link").each(function(a) {
             c.queue(a.href);
         })
     }
 });
 
 c.queue(["http://jamendo.com/","http://tedxparis.com", ...]);

 c.queue([{
     "uri":"http://parisjs.org/register",
     "method":"POST",
     "timeout":120,
     "callback":function(error,result,$) {
         $("div:contains(Thank you)").after(" very much");
     }
 }]);

