var http = require('http'),
    path = require('path'),
    url = require('url'),
    request = require('request'),
    _ = require('underscore'),
    jschardet = require('jschardet'),
    jsdom = require('jsdom'),
    zlib = require("zlib"),
    fs = require("fs"),
    Pool = require('generic-pool').Pool;

// Fallback on iconv-lite if we didn't succeed compiling iconv
// https://github.com/sylvinus/node-crawler/pull/29
var iconv, iconvLite;
try {
    iconv = require('iconv').Iconv;
} catch (e) {}

if (!iconv) {
    iconvLite = require('iconv-lite');
}


exports.VERSION = "0.2.5";

exports.Crawler = function(options) {

    var self = this;

    //Default options
    self.options = _.extend({
        timeout:        60000,
        jQuery:         true,
        jQueryUrl:      path.resolve(__dirname,"../vendor/jquery-1.8.3.min.js"),
        maxConnections: 10,
        priorityRange:  10,
        priority:       5,
        retries:        3,
        forceUTF8:      false,
        userAgent:      "node-crawler/"+exports.VERSION,
        autoWindowClose:true,
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
    };

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
        if (ropts.forceUTF8) {
            if (!ropts.headers["Accept-Charset"] && !ropts.headers["accept-charset"]) ropts.headers["Accept-Charset"] = 'utf-8;q=0.7,*;q=0.3';
            if (!ropts.encoding) ropts.encoding=null;
        }
        if (typeof ropts.encoding === 'undefined') {
            ropts.headers["Accept-Encoding"] = "gzip";
            ropts.encoding = null;
        }
        if (ropts.userAgent) {
            ropts.headers["User-Agent"] = ropts.userAgent;
        }
        if (ropts.proxies && ropts.proxies.length) {
            ropts.proxy = ropts.proxies[0];
        }

        var requestArgs = ["uri","url","qs","method","headers","body","form","json","multipart","followRedirect","followAllRedirects",
        "maxRedirects","encoding","pool","timeout","proxy","auth","oauth","strictSSL","jar","aws"];


        var req = request(_.pick.apply(this,[ropts].concat(requestArgs)), function(error,response,body) {
            if (error) return self.onContent(error, opts);

            response.uri = opts.uri;

            // Won't be needed after https://github.com/mikeal/request/pull/303 is merged
            if (response.headers['content-encoding'] && response.headers['content-encoding'].toLowerCase().indexOf('gzip') >= 0) {
                zlib.gunzip(response.body, function (error, body) {
                    if (error) return self.onContent(error, opts);

                    if (!opts.forceUTF8) {
                        response.body = body.toString(req.encoding);
                    } else {
                        response.body = body;
                    }

                    self.onContent(error,opts,response,false);
                });
            } else {
                self.onContent(error,opts,response,false);
            }

        });
    };

    self.onContent = function (error, toQueue, response, fromCache) {

        if (error) {

            if (toQueue.debug) {
                console.log("Error "+error+" when fetching "+toQueue.uri+(toQueue.retries?" ("+toQueue.retries+" retries left)":""));
            }

            if (toQueue.retries) {
                plannedQueueCallsCount++;
                setTimeout(function() {
                    toQueue.retries--;
                    plannedQueueCallsCount--;

                    // If there is a "proxies" option, rotate it so that we don't keep hitting the same one
                    if (toQueue.proxies) {
                        toQueue.proxies.push(toQueue.proxies.shift());
                    }

                    self.queue(toQueue);
                },toQueue.retryTimeout);

            } else if (toQueue.callback) {
                toQueue.callback(error);
            }

            return release(toQueue);
        }

        if (!response.body) response.body="";

        if (toQueue.debug) {
            console.log("Got "+(toQueue.uri||"html")+" ("+response.body.length+" bytes)...");
        }

        if (toQueue.forceUTF8) {
            //TODO check http header or meta equiv?
            var detected = jschardet.detect(response.body);

            if (detected && detected.encoding) {
                if (toQueue.debug) {
                    console.log("Detected charset "+detected.encoding+" ("+Math.floor(detected.confidence*100)+"% confidence)");
                }
                if (detected.encoding!="utf-8" && detected.encoding!="ascii") {

                    if (iconv) {
                        var iconvObj = new iconv(detected.encoding, "UTF-8//TRANSLIT//IGNORE");
                        response.body = iconvObj.convert(response.body).toString();

                    // iconv-lite doesn't support Big5 (yet)
                    } else if (detected.encoding != "Big5") {
                        response.body = iconvLite.decode(response.body, detected.encoding);
                    }

                } else if (typeof response.body != "string") {
                    response.body = response.body.toString();
                }

            } else {
                response.body = response.body.toString("utf8"); //hope for the best
            }

        } else {
            response.body = response.body.toString();
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

        // This could definitely be improved by *also* matching content-type headers
        var isHTML = response.body.match(/^\s*</);

        if (isHTML && toQueue.jQuery && toQueue.method!="HEAD") {

            // TODO support for non-HTML content
            // https://github.com/joshfire/node-crawler/issues/9
            try {
                var jsd = function(src) {
                    var env = jsdom.env({
                        "url":toQueue.uri,
                        "html":response.body,
                        "src":src,
                        "done":function(errors,window) {

                          var callbackError = false;

                          try {

                              if (errors) {
                                toQueue.callback(errors);
                              } else {
                                response.window = window;
                                toQueue.callback(null,response,window.jQuery);
                              }

                          } catch (e) {
                            callbackError = e;
                          }

                          // Free jsdom memory
                          if (toQueue.autoWindowClose) {
                            try {
                              window.close();
                              window = null;
                            } catch (err) {
                              console.log("Couldn't window.close : "+err);
                            }
                            response.body = null;
                            response = null;
                          }

                          release(toQueue);

                          if (callbackError) throw callbackError;
                        }
                    });
                };

                // jsdom doesn't support adding local scripts,
                // We have to read jQuery from the local fs
                if (toQueue.jQueryUrl.match(/^(file\:\/\/|\/)/)) {

                    // TODO cache this
                    fs.readFile(toQueue.jQueryUrl.replace(/^file\:\/\//,""),"utf-8",function(err,jq) {
                        if (err) {
                            toQueue.callback(err);
                            release(toQueue);
                        } else {
                            try {
                                jsd([jq]);
                            } catch (e) {
                                toQueue.callback(e);
                                release(toQueue);
                            }
                        }
                    });
                } else {
                    jsd([toQueue.jQueryUrl]);
                }

            } catch (e) {

                toQueue.callback(e);
                release(toQueue);
            }

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
    };

};

