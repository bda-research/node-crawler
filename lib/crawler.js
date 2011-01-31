
var http = require('http'),
    path = require('path'),
    url = require('url'),
    sys = require('sys'),
    request = require('request');


var Pool = require('generic-pool').Pool;

/* will be needed for jsdom>0.1.23
require('jsdom').defaultDocumentFeatures = {
   FetchExternalResources   : [], 
   ProcessExternalResources : false,
   MutationEvents           : false,
   QuerySelector            : false
};
*/


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
        timeout:        60,
        jQuery:         true,
        jQueryUrl:      path.normalize(__dirname+'/jquery-1.4.2.js'), //http://code.jquery.com/jquery-1.4.2.min.js",
        maxConnections: 10,
        priorityRange:  10,
        priority:       5, 
        retries:        3,
        retryTimeout:   10,
        method:         "GET",
        cache:          false, //false,true, [ttl?]
        skipDuplicates: false,
        priority:       0
    },options);

    //Do talks one by one
    this.pool = Pool({
       name     : 'crawler',
       //log      : this.options.debug,
       max      : this.options.maxConnections,
       priorityRange:this.options.priorityRange,
       create   : function(callback) {
           callback(1);
       },
       destroy  : function(client) {  }
    });
    
    this.cache = {};

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
        
        var useCache = function() {
            return ((toQueue.cache || toQueue.skipDuplicates) && (toQueue.method=="GET" || toQueue.method=="HEAD"));
        };
        
        
        var self = this;
        this.pool.acquire(function(poolRef) {
            
            var makeRequest;
            
            var onContent = function (error, response, body, fromCache) {
                
                if (toQueue.debug) {
                    if (error) {
                        console.log("Error "+error+" when fetching "+toQueue.uri+(toQueue.retries?" ("+toQueue.retries+" retries left)":""));
                    } else {
                        console.log("Got "+toQueue.uri+" ("+body.length+" bytes)...");
                    }
                }
                    
                if (error && toQueue.retries) {
                    setTimeout(function() {
                        toQueue.retries--;
                        makeRequest(toQueue);
                    },toQueue.retryTimeout*1000);
                    
                    //Don't return the poolRef yet.
                    return;
                }
                
                if (useCache() && !fromCache) {
                    self.cache[toQueue.uri] = [error,response,body];
                }
                
                if (typeof toQueue.callback=="function") {
                    
                    if (error) {
                        //No retries left here
                        toQueue.callback(error);
                        
                    } else {
                        
                        response.content = body;
                        response.request = toQueue;
                        
                        if (toQueue.jQuery && toQueue.method!="HEAD") {

                            var document = require("jsdom").jsdom(),
                            window = document.createWindow();
                            
                            document.innerHTML = body;
                            
                            response.window = window;
                            response.document = document;
                            
                            require("jsdom").jQueryify(window, toQueue.jQueryUrl,function() {
                                toQueue.callback(null,response,window.jQuery);
                            });
                        } else {
                            toQueue.callback(null,response);
                        }   
                    }   
                }
                self.pool.release(poolRef);
            };
            
            
            //Static HTML was given
            if (toQueue.html) {
                onContent(null,{},toQueue.html,false);
                
            //Make a HTTP request
            } else {
                
                makeRequest = function(q) {
                    
                    if (useCache()) {
                        if (self.cache[q.uri]) {
                            
                            //If a query has already been made to this URL, don't callback again
                            if (!q.skipDuplicates) {
                                onContent.apply(this,self.cache[q.uri].concat(true));
                            }
                            return;
                        }
                    }
                    
                    //Clean the object in case of a retry
                    delete q.client;
                    delete q.request;
                    
                    if (q.debug) {
                        console.log(q.method+" "+q.uri+" ...");
                    }
                    
                    request(q, function(error,response,body) {
                        q.uri=q.uri.href;
                        onContent(error,response,body,false);
                    });
                };
                
                if (typeof toQueue.uri=="function") {
                    toQueue.uri(function(uri) {
                        toQueue.uri=uri;
                        makeRequest(toQueue);
                    });
                } else {
                    makeRequest(toQueue);
                }
                
                
            }
            
            
        },toQueue.priority);
    }
    
}