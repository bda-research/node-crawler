
'use strict';

var path = require('path')
, util = require('util')
, EventEmitter = require('events').EventEmitter
, request = require('request')
, _ = require('lodash')
, cheerio = require('cheerio')
, fs = require('fs')
, charsetParser = require('charset-parser')
, Bottleneck = require('bottleneckp')
, seenreq = require('seenreq')
, iconvLite = require('iconv-lite')
, typeis = require('type-is').is;

var whacko=null;
try{
    whacko = require('whacko');
}catch(e){}

function defaultLog(){    //2016-11-24T12:22:55.639Z - debug: 
    console.log(new Date().toJSON()+" - "+ arguments[0] +": CRAWLER %s", util.format.apply(util, Array.prototype.slice.call(arguments, 1)));
}

function checkJQueryNaming (options) {
    if ('jquery' in options) {
        options.jQuery = options.jquery;
        delete options.jquery;
    }
    return options;
}

function readJqueryUrl (url, callback) {
    if (url.match(/^(file\:\/\/|\w+\:|\/)/)) {
        fs.readFile(url.replace(/^file\:\/\//,''),'utf-8', function(err,jq) {
            callback(err, jq);
        });
    } else {
        callback(null, url);
    }
}

function contentType(res){
    return get(res,'content-type');
}

function get(res,field){
    return res.headers[field.toLowerCase()] || '';
}

var log = defaultLog;

function Crawler (options) {
    var self = this;
    
    options = options||{};
    if(["onDrain", "preRequest","cache"].some(key => key in options)){
	throw new Error("Support for 'onDrain', 'preRequest', 'cache' has been removed! For more details, see https://github.com/bda-research/node-crawler");
    }
    
    self.init(options);
}
// augment the prototype for node events using util.inherits
util.inherits(Crawler, EventEmitter);

Crawler.prototype.init = function init (options) {
    var self = this;

    var defaultOptions = {
        autoWindowClose:        true,
        forceUTF8:              true,
        gzip:                   true,
        incomingEncoding:       null,
        jQuery:                 true,
        maxConnections:         10,
        method:                 'GET',
        priority:               5,
        priorityRange:          10,
        rateLimit:             0,
        referer:                false,
        retries:                3,
        retryTimeout:           10000,
        timeout:                15000,
        skipDuplicates:         false,
        rotateUA:               false,
	homogeneous:            false
    };

    //return defaultOptions with overriden properties from options.
    self.options = _.extend(defaultOptions, options);

    // you can use jquery or jQuery
    self.options = checkJQueryNaming(self.options);
    
    // Don't make these options persist to individual queries
    self.globalOnlyOptions = ['maxConnections', 'rateLimit', 'priorityRange', 'homogeneous', 'skipDuplicates', 'rotateUA'];

    self.limiters = new Bottleneck.Cluster(self.options.maxConnections,self.options.rateLimit,self.options.priorityRange, self.options.priority, self.options.homogeneous);
    self.seen = new seenreq();
    self.debug = self.options.debug || false;
    self.mapEntity = Object.create(null);
    self.entityList = ["jar"];

    if(self.options.logger)
	log = self.options.logger.log;

    self.on('_release', function(){
	if(this.debug)
	    log('debug',"Queue size: %d",this.queueSize);
	
	if(this.limiters.empty)
	    return this.emit('drain');
    });
};

Crawler.prototype._inject = function _inject (response, options, callback) {
    var $;

    if (options.jQuery === 'whacko') {
	if(!whacko){
	    throw new Error("Please install whacko by your own since `crawler` detected you specify explicitly");
	}
	
	$ = whacko.load(response.body);
	callback(null, response, options, $);
    }else if (options.jQuery === 'cheerio' || options.jQuery.name === 'cheerio' || options.jQuery === true) {
        var defaultCheerioOptions = {
            normalizeWhitespace: false,
            xmlMode: false,
            decodeEntities: true
        };
        var cheerioOptions = options.jQuery.options || defaultCheerioOptions;
        $ = cheerio.load(response.body, cheerioOptions);

        callback(null, response, options, $);
    }else if (options.jQuery.jsdom) {
        var jsdom = options.jQuery.jsdom;
        var scriptLocation = path.resolve(__dirname, '../vendor/jquery-2.1.1.min.js');

        //Use promises
        readJqueryUrl(scriptLocation, function(err, jquery) {
            try {
                jsdom.env({
                    url: options.uri,
                    html: response.body,
                    src: [jquery],
                    done: function (errors, window) {
                        $ = window.jQuery;
                        callback(errors, response, options, $);

                        try {
                            window.close();
                            window = null;
                        } catch (err) {
                            log("error",err);
                        }

                    }
                });
            } catch (e) {
                options.callback(e,{options}, options.release);
            }
        });
    }
    // Jquery is set to false are not set
    else {
        callback(null, response, options);
    }
};

Crawler.prototype.queue = function queue (options) {
    var self = this;
    
    // Did you get a single object or string? Make it compatible.
    options = _.isArray(options) ? options : [options];

    options = _.flattenDeep(options);

    for(var i = 0; i < options.length; ++i) {
        if(_.isNull(options[i]) || _.isUndefined(options[i]) || (!_.isString(options[i]) && !_.isPlainObject(options[i]))) {
            if(self.debug) {
                log("warn","Illegal queue option: ", JSON.stringify(options[i]));
            }
            continue;
        }
        self._pushToQueue(
            _.isString(options[i]) ? {uri: options[i]} : options[i]
        );
    }
};

Crawler.prototype._pushToQueue = function _pushToQueue (options) {
    var self = this;

    // you can use jquery or jQuery
    options = checkJQueryNaming(options);

    _.defaults(options, self.options);

    // Remove all the global options from our options
    // TODO we are doing this for every _pushToQueue, find a way to avoid this
    self.globalOnlyOptions.forEach(globalOnlyOption=>delete options[globalOnlyOption]);

    // If duplicate skipping is enabled, avoid queueing entirely for URLs we already crawled
    if (options.skipDuplicates && self.seen.exists(options)) {
        return
    }

    self.emit('schedule',options);
    
    self.limiters.key(options.limiter||"default").submit(options.priority,function(done, limiter){
	options.release = function(){ done();self.emit('_release'); };
	if(!options.callback)
	    options.callback = options.release;
	
	if (limiter) {
	    self.emit('limiterChange', options, limiter)
	}
	
	if (options.html) {
            self._onContent(null, options, {body:options.html,headers:{'content-type':"text/html"}})
        } else if (typeof options.uri === 'function') {
            options.uri(function(uri) {
                options.uri = uri
                self._buildHttpRequest(options)
            })
        } else {
            self._buildHttpRequest(options)
        }
    });
};

Crawler.prototype._deleteEntity = function _deleteEntity(options){
    var self = this;
    self.entityList.forEach(function(name){
	if(typeof options[name] === "object"){
	    self.mapEntity[name] = options[name];
	    delete options[name];
	}
    })
}

Crawler.prototype._attachEntity = function _attachEntity(options){
    var self = this;
    return self.entityList.reduce(function(target,name){
	if(typeof self.mapEntity[name] === "object")
	    target[name] = self.mapEntity[name];
	
	return target;
    }, options);
}

Crawler.prototype._buildHttpRequest = function _buildHTTPRequest (options) {
    var self = this;

    if (self.debug) {
        log("debug",options.method+' '+options.uri);
	if(options.proxy)
	    log("debug","Use proxy: %s", options.proxy);
    }

    // Cloning keeps the opts parameter clean:
    // - some versions of "request" apply the second parameter as a
    // property called "callback" to the first parameter
    // - keeps the query object fresh in case of a retry
    // Doing parse/stringify instead of _.clone will do a deep clone and remove functions
    
    self._deleteEntity(options);
    var ropts = JSON.parse(JSON.stringify(options));
    self._attachEntity(ropts);
    
    if (!ropts.headers) { ropts.headers={}; }
    if (ropts.forceUTF8) {ropts.encoding=null;}
    if (ropts.userAgent) {
	if(ropts.rotateUA && _.isArray(ropts.userAgent)){
            ropts.headers['User-Agent'] = ropts.userAgent[0];
            // If "rotateUA" is true, rotate User-Agent
            options.userAgent.push(options.userAgent.shift());
	}else{
            ropts.headers['User-Agent'] = ropts.userAgent;
	}
	
	if(self.debug){
            log("info",ropts.headers['User-Agent']);
	}
    }
    
    if (ropts.referer) {
        ropts.headers.Referer = ropts.referer;
    }
    
    if (ropts.proxies && ropts.proxies.length) {
        ropts.proxy = ropts.proxies[0];
    }
    
    self.emit("request",ropts);

    var requestArgs = ['uri','url','qs','method','headers','body','form','json','multipart','followRedirect',
		       'followAllRedirects', 'maxRedirects','encoding','pool','timeout','proxy','auth','oauth','strictSSL',
		       'jar','aws','gzip','time','tunnel','proxyHeaderWhiteList','proxyHeaderExclusiveList','localAddress','forever'];

    request(_.pick.apply(self,[ropts].concat(requestArgs)), function(error,response) {
        if (error) {
            return self._onContent(error, options);
        }
	
        self._onContent(error,options,response);
    });
};

Crawler.prototype._onContent = function _onContent (error, options, response) {
    var self = this;

    if (error) {
        if (self.debug) {
            log("error",'Error '+error+' when fetching '+
			 options.uri+(options.retries?' ('+options.retries+' retries left)':''));
        }
	
        if (options.retries) {
            setTimeout(function() {
                options.retries--;
		self.queue(options);
		options.release();
            },options.retryTimeout);
        } else{
            options.callback(error,{options:options},options.release);
	}
	
	return;
    }
    
    if (!response.body) { response.body=''; }

    if (self.debug) {
        log("debug",'Got '+(options.uri||'html')+' ('+response.body.length+' bytes)...');
    }

    try{
        self._doEncoding(options,response);
    }catch(e){
        log("error",e);
	return options.callback(e,{options:options},options.release);
    }
    
    response.options = options;

    if(options.method === 'HEAD' || !options.jQuery){
	return options.callback(null,response,options.release);
    }

    if (!options.html && !typeis(contentType(response), ['html'])){
	log("warn","response body is not HTML, skip injecting");
	return options.callback(null,response,options.release);
    }

    if(self.debug)
	log("debug","Injecting");
    
    self._inject(response, options, self._injected.bind(self));
};

Crawler.prototype._injected = function(errors, response, options, $){
    if(this.debug)
	log("debug","Injected")

    response.$ = $;
    options.callback(errors, response, options.release);
}

Crawler.prototype._doEncoding = function(options,response){
    var self = this;
    
    if(options.encoding === null){
	return;
    }
    
    if (options.forceUTF8) {
	var charset = options.incomingEncoding || self._parseCharset(response);
	
	if (self.debug) {
            log("debug",'Charset ' + charset);
        }
	
        if (charset !== 'utf-8' && charset !== 'ascii') {// convert response.body into 'utf-8' encoded buffer
            response.body = iconvLite.decode(response.body, charset);
        }
    }
    
    response.body = response.body.toString();
}

Crawler.prototype._parseCharset = function(res){
    var charset = charsetParser(contentType(res));
    if(charset)
	return charset;
    
    var body = res.body instanceof Buffer?res.body.toString():res.body;
    charset = charsetParser(contentType(res),body,'utf-8');
    
    return charset;
}

Object.defineProperty(Crawler.prototype,'queueSize',{
    get:function(){
	return this.limiters.unfinishedClients;
    }
})

module.exports = Crawler;
