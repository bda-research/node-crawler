
var http = require('http'),
    path = require('path'),
    url = require('url'),
    sys = require('sys'),
    request = require('request'),
    jQuery = require('jquery');


var Pool = require('generic-pool').Pool;

/* will be needed for jsdom>0.1.23
require('jsdom').defaultDocumentFeatures = {
   FetchExternalResources   : [], 
   ProcessExternalResources : false,
   MutationEvents           : false,
   QuerySelector            : false
};
*/

exports.Crawler = function(options) {
    
    //Default options
    this.options = jQuery.extend({
        timeout:        60,
        jQuery:         true,
        jQueryUrl:      require.resolve('jquery'),
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
            toQueue = jQuery.extend({}, this.options, { "uri":item });
        } else {
            toQueue = jQuery.extend({}, this.options, item);
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

                            var document = require("jsdom").jsdom(body),
                            window = document.createWindow();
                            
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



                    if (q.debug) {
                        console.log(q.method+" "+q.uri+" ...");
                    }

                    // Cloning keeps the q parameter clean:
                    // - some versions of "request" apply the second parameter as a
                    // property called "callback" to the first parameter
                    // - keeps the query object fresh in case of a retry
                    q = jQuery.extend({}, q);
                    request(q, function(error,response,body) {
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

