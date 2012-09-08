
var http = require('http'),
    path = require('path'),
    url = require('url'),
    request = require('request'),
    _ = require('underscore'),
    jschardet = require('jschardet'),
    Iconv = require('iconv').Iconv,
    jsdom = require('jsdom'),
    Pool = require('generic-pool').Pool;


exports.Crawler = function(options) {
    
    var self = this;

    //Default options
    self.options = _.extend({
        timeout:        60000,
        jQuery:         true,
        jQueryUrl:      path.resolve(__dirname,"../vendor/jquery-1.8.1.min.js"),
        maxConnections: 10,
        priorityRange:  10,
        priority:       5, 
        retries:        3,
        forceUTF8:      false,
        retryTimeout:   10000,
        method:         "GET",
        cache:          false, //false,true, [ttl?]
        skipDuplicates: false,
        onDrain:        false
    },options);

    // Don't make these options persist to individual queries
    var masterOnlyOptions = ["maxConnections", "priorityRange", "onDrain"];

    //Setup a worker pool w/ https://github.com/coopernurse/node-pool
    self.pool = Pool({
        name         : 'crawler',
        //log        : self.options.debug,
        max          : self.options.maxConnections,
        priorityRange: self.options.priorityRange,
        create       : function(callback) {
           callback(1);
        },
        destroy      : function(client) {

        }
    });

    var plannedQueueCallsCount = 0;
    var queuedCount = 0;

    var release = function(opts) {
        
        queuedCount--;
        // console.log("Released... count",queuedCount,plannedQueueCallsCount);

        if (opts._poolRef) self.pool.release(opts._poolRef);

        // Pool stats are behaving weird - have to implement our own counter
        // console.log("POOL STATS",{"name":self.pool.getName(),"size":self.pool.getPoolSize(),"avail":self.pool.availableObjectsCount(),"waiting":self.pool.waitingClientsCount()});

        
        if (queuedCount+plannedQueueCallsCount === 0) {
            if (self.options.onDrain) self.options.onDrain();
        }
    }

    self.onDrain = function() {};
    
    self.cache = {};

    var useCache = function(opts) {
        return (opts.uri && (opts.cache || opts.skipDuplicates) && (opts.method=="GET" || opts.method=="HEAD"));
    };

    self.request = function(opts) {
        
        // console.log("OPTS",opts);
        
        if (useCache(opts)) {
            
            var cacheData = self.cache[opts.uri];

            //If a query has already been made to self URL, don't callback again
            if (cacheData) {

                // Make sure we actually have cached data, and not just a note 
                // that the page was already crawled
                if (_.isArray(cacheData)) {
                    self.onContent(null,opts,cacheData[0],true);
                } else {
                    release(opts);
                }
                return;
                
            }
        }

        if (opts.debug) {
            console.log(opts.method+" "+opts.uri+" ...");
        }

        // Cloning keeps the opts parameter clean:
        // - some versions of "request" apply the second parameter as a
        // property called "callback" to the first parameter
        // - keeps the query object fresh in case of a retry
        // Doing parse/stringify instead of _.clone will do a deep clone and remove functions

        var ropts = JSON.parse(JSON.stringify(opts));

        if (!ropts.headers) ropts.headers={};
        if (opts.forceUTF8) {
            if (!ropts.headers["Accept-Charset"] && !ropts.headers["accept-charset"]) ropts.headers["Accept-Charset"] = 'utf-8;q=0.7,*;q=0.3';
            if (!ropts.encoding) ropts.encoding=null;
        }

        request(ropts, function(error,response,body) {
            if (error) return self.onContent(error, opts);

            response.uri = opts.uri;
            self.onContent(error,opts,response,false);
        });
    };

    self.onContent = function (error, toQueue, response, fromCache) {

        if (true || toQueue.debug) {
            if (error) {
                console.log("Error "+error+" when fetching "+toQueue.uri+(toQueue.retries?" ("+toQueue.retries+" retries left)":""));
            } else {
                console.log("Got "+(toQueue.uri||"html")+" ("+response.body.length+" bytes)...");
            }
        }
            
        if (error) {
            if (toQueue.retries) {
                plannedQueueCallsCount++;
                setTimeout(function() {
                    toQueue.retries--;
                    plannedQueueCallsCount--;
                    self.queue(toQueue);
                },toQueue.retryTimeout);
    
            } else if (toQueue.callback) {
                toQueue.callback(error);
            }

            return release(toQueue);
        }

        if (toQueue.forceUTF8) {
            //TODO check http header or meta equiv?
            var detected = jschardet.detect(response.body);
            
            if (detected && detected.encoding) {
                if (toQueue.debug) {
                    console.log("Detected charset "+detected.encoding+" ("+Math.floor(detected.confidence*100)+"% confidence)");
                }
                if (detected.encoding!="utf-8" && detected.encoding!="ascii") {
                    var iconv = new Iconv(detected.encoding, "UTF-8//TRANSLIT//IGNORE");
                    response.body = iconv.convert(response.body).toString();
                } else if (typeof response.body != "string") {
                    response.body = response.body.toString();
                }
                
            } else {
                response.body = response.body.toString("utf8"); //hope for the best
            }

        }

        if (useCache(toQueue) && !fromCache) {
            if (toQueue.cache) {
                self.cache[toQueue.uri] = [response];

            //If we don't cache but still want to skip duplicates we have to maintain a list of fetched URLs.
            } else if (toQueue.skipDuplicates) { 
                self.cache[toQueue.uri] = true;
            }
        }
        
        if (!toQueue.callback) return release(toQueue);

        response.options = toQueue;

        if (toQueue.jQuery && toQueue.method!="HEAD") {

            jsdom.env(response.body,[toQueue.jQueryUrl],function(errors,window) {
              if (errors) {
                toQueue.callback(errors);
              } else {
                response.window = window;
                toQueue.callback(null,response,window.jQuery); 
              }

              release(toQueue);
            });
            
        } else {

            toQueue.callback(null,response);
            release(toQueue);
        }   

    };

    self.queue = function(item) {
        
        //Did we get a list ? Queue all the URLs.
        if (_.isArray(item)) {
            for (var i=0;i<item.length;i++) {
                self.queue(item[i]);
            }
            return;
        }

        queuedCount++;
        
        var toQueue=item;

        //Allow passing just strings as URLs
        if (_.isString(item)) {
            toQueue = {"uri":item};
        }

        _.defaults(toQueue,self.options);

        // Cleanup options
        _.each(masterOnlyOptions,function(o) {
            delete toQueue[o];
        });
        
        // If duplicate skipping is enabled, avoid queueing entirely for URLs we already crawled
        if (toQueue.skipDuplicates && self.cache[toQueue.uri]) {
          return release(toQueue);
        }
        
        self.pool.acquire(function(err, poolRef) {
            
            //TODO - which errback to call?
            if (err) {
                console.error("pool acquire error:",err);
                return release(toQueue);
            }

            toQueue._poolRef = poolRef;
            
            // We need to check again for duplicates because the cache might have
            // been completed since we queued self task.
            if (toQueue.skipDuplicates && self.cache[toQueue.uri]) {
              return release(toQueue);
            }

            //Static HTML was given, skip request
            if (toQueue.html) {
                self.onContent(null,toQueue,{body:toQueue.html},false);
                return;
            }

            //Make a HTTP request
            if (typeof toQueue.uri=="function") {
                toQueue.uri(function(uri) {
                    toQueue.uri=uri;
                    self.request(toQueue);
                });
            } else {
                self.request(toQueue);
            }
            
        },toQueue.priority);
    }
    
};

