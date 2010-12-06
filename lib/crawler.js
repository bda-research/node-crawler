
var http = require('http'),
    path = require('path'),
    url = require('url'),
    sys = require('sys'),
    request = require('request');

try {
    //https://github.com/joshfire/node-pool
    var Pool = require('../../node-pool/lib/generic-pool.js').Pool;
} catch (e) {
    var Pool = require('generic-pool').Pool;
}
  


var cloneAndExtend = function(obj,ext) {
    var clone = {};
    clone.prototype = obj.prototype;
    for (property in obj) clone[property] = obj[property];
    for (property in ext) clone[property] = ext[property];
    return clone;
}

exports.Crawler = function(options) {
    
    //Default options
    this.options = cloneAndExtend({
        "timeout":60,
        "jQueryify":true,
        "maxConnections":10,
        "jQuery":'http://code.jquery.com/jquery-1.4.2.min.js',
        "method":"GET",
        "priority":0
    },options);

    //Do talks one by one
    this.pool = Pool({
       name     : 'crawler',
       max      : this.options["maxConnections"],
       create   : function(callback) {
           callback(1);
       },
       destroy  : function(client) {  }
    });
    

    this.queue = function(item) {
        
        //Did we get a list ? Queue all the URLs.
        if (item instanceof Array) {
            for (var i=0;i<item.length;i++) {
                this.queue(item[i]);
            }
            return;
        }
        
        var toQueue = {};
        
        //Allow passing just strings as URLs
        if (typeof item=="string") {
            toQueue = cloneAndExtend(this.options,{
                "uri":item
            });
            
        } else {
            toQueue = cloneAndExtend(this.options,item);
        }
        
        var self = this;
        this.pool.borrow(function(poolRef) {
            
            
            var onContent = function (error, response, body) {
                
                if (toQueue["debug"]) {
                    if (error) {
                        console.log("Error "+error+" when fetching "+toQueue["uri"].href);
                    } else {
                        console.log("Got "+toQueue["uri"].href+" ("+body.length+" bytes)...");
                    }
                }
                    
                
                if (typeof toQueue["callback"]=="function") {
                    
                    if (error) {
                        toQueue["callback"](error);

                    } else {
                        
                        response.content = body;
                        response.request = toQueue;
                        
                        if (toQueue["jQueryify"] && toQueue["method"]!="HEAD") {

                            var document = require("jsdom").jsdom(),
                            window = document.createWindow();
                            
                            document.innerHTML = body;
                            
                            response.window = window;
                            response.document = document;
                            
                            require("jsdom").jQueryify(window, toQueue["jQuery"],function() {
                                toQueue["callback"](null,response,window.jQuery);
                            });
                        } else {
                            toQueue["callback"](null,response);
                        }   
                    }   
                }
                self.pool.returnToPool(poolRef);
            };
            
            
            //Static HTML was given
            if (toQueue["html"]) {
                onContent(null,{},toQueue["html"]);
                
            //Make a HTTP request
            } else {
                
                var makeRequest = function(q) {
                    if (q["debug"])
                        console.log("Fetching "+q["uri"]+" ...");
                    request(q, onContent);
                };
                
                if (typeof toQueue["uri"]=="function") {
                    toQueue["uri"](function(uri) {
                        toQueue["uri"]=uri;
                        makeRequest(toQueue);
                    });
                } else {
                    makeRequest(toQueue);
                }
                
                
            }
            
            
        },toQueue["priority"]);
    }
    
}