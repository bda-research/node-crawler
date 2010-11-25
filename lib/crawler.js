
var http = require('http'),
    path = require('path'),
    url = require('url'),
    sys = require('sys'),
    Pool = require('generic-pool').Pool,
    request = require('request');


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
        "method":"GET"
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
        
        var toQueue = {};
        
        if (typeof item=="string") {
            toQueue = cloneAndExtend(this.options,{
                "uri":item
            });
        } else {
            toQueue = cloneAndExtend(this.options,item);
        }
        
        this.pool.borrow(function(poolRef) {
            
            request(toQueue, function (error, response, body) {
                
                if (typeof toQueue["callback"]=="function") {
                    
                    if (error) {
                        toQueue["callback"]();

                    } else {
                        
                        response.body = body;
                        
                        if (toQueue["jQueryify"]) {

                            var document = require("jsdom").jsdom(),
                            window = document.createWindow();
                            
                            response.window = window;
                            response.document = document;
                            
                            require("jsdom").jQueryify(a.window, toQueue["jQuery"],function() {
                                toQueue["callback"](null,response,window.jQuery);
                            });
                        } else {
                            toQueue["callback"](null,response);
                        }
                        
                    }
                    
                }
                
                pool.returnToPool(poolRef);
            });
        });
    }
    
}