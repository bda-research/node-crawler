
<p align="center">
  <a href="https://github.com/bda-research/node-crawler">
    <img alt="Node.js" src="https://raw.githubusercontent.com/bda-research/node-crawler/master/crawler_primary.png" width="400"/>
  </a>
</p>


#
[![npm package](https://nodei.co/npm/crawler.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/crawler/)

[![build status](https://travis-ci.org/bda-research/node-crawler.svg?branch=master)](https://travis-ci.org/bda-research/node-crawler)
[![Coverage Status](https://coveralls.io/repos/github/bda-research/node-crawler/badge.svg?branch=master)](https://coveralls.io/github/bda-research/node-crawler?branch=master)
[![Dependency Status](https://david-dm.org/bda-research/node-crawler/status.svg)](https://david-dm.org/bda-research/node-crawler)
[![NPM download][download-image]][download-url]
[![NPM quality][quality-image]][quality-url]
[![Gitter](https://img.shields.io/badge/gitter-join_chat-blue.svg?style=flat-square)](https://gitter.im/node-crawler/discuss?utm_source=badge)

[quality-image]: http://npm.packagequality.com/shield/crawler.svg?style=flat-square
[quality-url]: http://packagequality.com/#?package=crawler
[download-image]: https://img.shields.io/npm/dm/crawler.svg?style=flat-square
[download-url]: https://npmjs.org/package/crawler


Most powerful, popular and production crawling/scraping package for Node, happy hacking :)

Features:

 * server-side DOM & automatic jQuery insertion with Cheerio (default) or JSDOM
 * Configurable pool size and retries
 * Control rate limit
 * Priority queue of requests
 * forceUTF8 mode to let crawler deal for you with charset detection and conversion
 * Compatible with 4.x or newer version

Here is the [CHANGELOG](https://github.com/bda-research/node-crawler/blob/master/CHANGELOG.md)

Thanks to [Authuir](https://github.com/authuir), we have a [Chinese](http://node-crawler.readthedocs.io/zh_CN/latest/) docs. Other languages are welcomed!


# Get started

## How to install


    $ npm install crawler

## Usage


```js
var Crawler = require("crawler");

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            console.log($("title").text());
        }
        done();
    }
});

// Queue just one URL, with default callback
c.queue('http://www.amazon.com');

// Queue a list of URLs
c.queue(['http://www.google.com/','http://www.yahoo.com']);

// Queue URLs with custom callbacks & parameters
c.queue([{
    uri: 'http://parishackers.org/',
    jQuery: false,

    // The global callback won't be called
    callback: function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            console.log('Grabbed', res.body.length, 'bytes');
        }
        done();
    }
}]);

// Queue some HTML code directly without grabbing (mostly for tests)
c.queue([{
    html: '<p>This is a <strong>test</strong></p>'
}]);
```

## Slow down
Use `rateLimit` to slow down when you are visiting web sites.

```js
var crawler = require("crawler");

var c = new Crawler({
    rateLimit: 1000, // `maxConnections` will be forced to 1
    callback: function(err, res, done){
        console.log(res.$("title").text());
        done();
    }
});

c.queue(tasks);//between two tasks, minimum time gap is 1000 (ms)
```

## Custom parameters

Sometimes you have to access variables from previous request/response session, what should you do is passing parameters as same as options:

```js
c.queue({
    uri:"http://www.google.com",
    parameter1:"value1",
    parameter2:"value2",
    parameter3:"value3"
})
```

then access them in callback via `res.options`

```js
console.log(res.options.parameter1);
```

Crawler picks options only needed by request, so dont't worry about the redundance.

## Raw body

If you are downloading files like image, pdf, word etc, you have to save the raw response body which means Crawler shouldn't convert it to string. To make it happen, you need to set encoding to null

```js
var fs = require('fs');

var c = new Crawler({
    encoding:null,
    jQuery:false,// set false to suppress warning message.
    callback:function(err, res, done){
        if(err){
            console.error(err.stack);
        }else{
            fs.createWriteStream(res.options.filename).write(res.body);
        }
        
        done();
    }
});

c.queue({
    uri:"https://nodejs.org/static/images/logos/nodejs-1920x1200.png",
    filename:"nodejs-1920x1200.png"
});

```

## preRequest

If you want to do something either synchronously or asynchronously before each request, you can try the code below. Note that direct requests won't trigger preRequest.

```js
var c = new Crawler({
    preRequest: function(options, done) {
        // 'options' here is not the 'options' you pass to 'c.queue', instead, it's the options that is going to be passed to 'request' module 
        console.log(options);
	// when done is called, the request will start
	done();
    },
    callback: function(err, res, done) {
        if(err) {
	    console.log(err)
	} else {
	    console.log(res.statusCode)
	}
    }
});

c.queue({
    uri: 'http://www.google.com',
    // this will override the 'preRequest' defined in crawler
    preRequest: function(options, done) {
        setTimeout(function() {
	    console.log(options);
	    done();
	}, 1000)
    }
});
```

## Options reference


You can pass these options to the Crawler() constructor if you want them to be global or as
items in the queue() calls if you want them to be specific to that item (overwriting global options)

This options list is a strict superset of [mikeal's request options](https://github.com/mikeal/request#requestoptions-callback) and will be directly passed to
the request() method.

Basic request options:

 * `uri`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The url you want to crawl.
 * `timeout` : [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) In milliseconds (Default 15000).
 * [All mikeal's request options are accepted](https://github.com/mikeal/request#requestoptions-callback).

Callbacks:

 * `callback(error, res, done)`: Function that will be called after a request was completed
     * `error`: [Error](https://nodejs.org/api/errors.html)
     * `res`: [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) A response of standard IncomingMessage includes `$` and `options`
         * `res.statusCode`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) HTTP status code. E.G.`200`
         * `res.body`: [Buffer](https://nodejs.org/api/buffer.html) | [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) HTTP response content which could be a html page, plain text or xml document e.g.
         * `res.headers`: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) HTTP response headers
         * `res.request`: [Request](https://github.com/request/request)  An instance of Mikeal's `Request` instead of [http.ClientRequest](https://nodejs.org/api/http.html#http_class_http_clientrequest)
             * `res.request.uri`: [urlObject](https://nodejs.org/api/url.html#url_url_strings_and_url_objects) HTTP request entity of parsed url
             * `res.request.method`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) HTTP request method. E.G. `GET`
             * `res.request.headers`: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) HTTP request headers
         * `res.options`: [Options](#options-reference) of this task
         * `$`: [jQuery Selector](https://api.jquery.com/category/selectors/) A selector for  html or xml document.
     * `done`: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) It must be called when you've done your work in callback.

Schedule options:

 * `maxConnections`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Size of the worker pool (Default 10).
 * `rateLimit`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Number of milliseconds to delay between each requests (Default 0).
 * `priorityRange`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Range of acceptable priorities starting from 0 (Default 10).
 * `priority`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Priority of this request (Default 5). Low values have higher priority.

Retry options:

 * `retries`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Number of retries if the request fails (Default 3),
 * `retryTimeout`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Number of milliseconds to wait before retrying (Default 10000),

Server-side DOM options:

 * `jQuery`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)|[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)|[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Use `cheerio` with default configurations to inject document if true or "cheerio". Or use customized `cheerio` if an object with [Parser options](https://github.com/fb55/htmlparser2/wiki/Parser-options). Disable injecting jQuery selector if false. If you have memory leak issue in your project, use "whacko", an alternative parser,to avoid that. (Default true)

Charset encoding:

 * `forceUTF8`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true crawler will get charset from HTTP headers or meta tag in html and convert it to UTF8 if necessary. Never worry about encoding anymore! (Default true),
 * `incomingEncoding`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) With forceUTF8: true to set encoding manually (Default null) so that crawler will not have to detect charset by itself. For example, `incomingEncoding : 'windows-1255'`. See [all supported encodings](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings)

Cache:

 * `skipDuplicates`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true skips URIs that were already crawled, without even calling callback() (Default false). __This is not recommended__, it's better to handle outside `Crawler` use [seenreq](https://github.com/mike442144/seenreq)

Other:

 * `rotateUA`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true, `userAgent` should be an array and rotate it (Default false) 
 * `userAgent`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), If `rotateUA` is false, but `userAgent` is an array, crawler will use the first one.
 * `referer`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) If truthy sets the HTTP referer header

## Send request directly

In case you want to send a request directly without going through the scheduler in Crawler, try the code below. `direct` takes the same options as `queue`, please refer to [options](#options-reference) for detail. The difference is when calling `direct`, `callback` must be defined explicitly, with two arguments `error` and `response`, which are the same as that of `callback` of method `queue`.

```js
crawler.direct({
    uri: 'http://www.google.com',
    skipEventRequest: false, // default to true, direct requests won't trigger Event:'request'
    callback: function(error, response) {
        if(error) {
            console.log(error)
        } else {
            console.log(response.statusCode);
        }
    }
});
```

 
## Class:Crawler

### Event: 'schedule'
 * `options` [Options](#options-reference)

Emitted when a task is being added to scheduler.

```js
crawler.on('schedule',function(options){
    options.proxy = "http://proxy:port";
});
```

### Event: 'limiterChange'
 * `options` [Options](#options-reference)
 * `limiter` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)

Emitted when limiter has been changed.

### Event: 'request'
 * `options` [Options](#options-reference)

Emitted when crawler is ready to send a request.

If you are going to modify options at last stage before requesting, just listen on it.

```js
crawler.on('request',function(options){
    options.qs.timestamp = new Date().getTime();
});
```

### Event: 'drain'

Emitted when queue is empty.

```js
crawler.on('drain',function(){
    // For example, release a connection to database.
    db.end();// close connection to MySQL
});
```

### crawler.queue(uri|options)
 * `uri` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
 * `options` [Options](#options-reference)

Enqueue a task and wait for it to be executed.

### crawler.queueSize
 * [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)

Size of queue, read-only


## Work with bottleneck

Control rate limit for with limiter. All tasks submit to a limiter will abide the `rateLimit` and `maxConnections` restrictions of the limiter. `rateLimit` is the minimum time gap between two tasks. `maxConnections` is the maximum number of tasks that can be running at the same time. Limiters are independent of each other. One common use case is setting different limiters for different proxies. One thing is worth noticing, when `rateLimit` is set to a non-zero value, `maxConnections` will be forced to 1.

```js
var crawler = require('crawler');

var c = new Crawler({
    rateLimit: 2000,
    maxConnections: 1,
    callback: function(error, res, done) {
        if(error) {
            console.log(error)
        } else {
            var $ = res.$;
            console.log($('title').text())
        }
        done();
    }
})

// if you want to crawl some website with 2000ms gap between requests
c.queue('http://www.somewebsite.com/page/1')
c.queue('http://www.somewebsite.com/page/2')
c.queue('http://www.somewebsite.com/page/3')

// if you want to crawl some website using proxy with 2000ms gap between requests for each proxy
c.queue({
    uri:'http://www.somewebsite.com/page/1',
    limiter:'proxy_1',
    proxy:'proxy_1'
})
c.queue({
    uri:'http://www.somewebsite.com/page/2',
    limiter:'proxy_2',
    proxy:'proxy_2'
})
c.queue({
    uri:'http://www.somewebsite.com/page/3',
    limiter:'proxy_3',
    proxy:'proxy_3'
})
c.queue({
    uri:'http://www.somewebsite.com/page/4',
    limiter:'proxy_1',
    proxy:'proxy_1'
})
```

Normally, all limiter instances in limiter cluster in crawler are instantiated with options specified in crawler constructor. You can change property of any limiter by calling the code below. Currently, we only support changing property 'rateLimit' of limiter. Note that the default limiter can be accessed by `c.setLimiterProperty('default', 'rateLimit', 3000)`. We strongly recommend that you leave limiters unchanged after their instantiation unless you know clearly what you are doing.
```js
var c = new Crawler({});
c.setLimiterProperty('limiterName', 'propertyName', value)
```

## Work with Cheerio or JSDOM


Crawler by default use [Cheerio](https://github.com/cheeriojs/cheerio) instead of [JSDOM](https://github.com/tmpvar/jsdom). JSDOM is more robust, if you want to use JSDOM you will have to require it `require('jsdom')` in your own script before passing it to crawler.

### Working with Cheerio
```js
jQuery: true //(default)
//OR
jQuery: 'cheerio'
//OR
jQuery: {
    name: 'cheerio',
    options: {
        normalizeWhitespace: true,
        xmlMode: true
    }
}
```
These parsing options are taken directly from [htmlparser2](https://github.com/fb55/htmlparser2/wiki/Parser-options), therefore any options that can be used in `htmlparser2` are valid in cheerio as well. The default options are:

```js
{
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
}
```

For a full list of options and their effects, see [this](https://github.com/fb55/DomHandler) and
[htmlparser2's options](https://github.com/fb55/htmlparser2/wiki/Parser-options).
[source](https://github.com/cheeriojs/cheerio#loading)

### Work with JSDOM

In order to work with JSDOM you will have to install it in your project folder `npm install jsdom`, and pass it to crawler.

```js
var jsdom = require('jsdom');
var Crawler = require('crawler');

var c = new Crawler({
    jQuery: jsdom
});
```

# How to test

Crawler uses `nock` to mock http request, thus testing no longer relying on http server.

```bash
$ npm install
$ npm test
$ npm run cover # code coverage
```

## Alternative: Docker

After [installing Docker](http://docs.docker.com/), you can run:

```bash
# Builds the local test environment
$ docker build -t node-crawler .

# Runs tests
$ docker run node-crawler sh -c "npm install && npm test"

# You can also ssh into the container for easier debugging
$ docker run -i -t node-crawler bash
```


# Rough todolist

 * Introducing zombie to deal with page with complex ajax
 * Refactoring the code to be more maintainable
 * Make Sizzle tests pass (JSDOM bug? https://github.com/tmpvar/jsdom/issues#issue/81)
 * Promise support
 * Commander support
 * Middleware support
