
# node-crawler
[![npm package](https://nodei.co/npm/crawler.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/crawler/)

[![build status](https://secure.travis-ci.org/bda-research/node-crawler.png)](https://travis-ci.org/bda-research/node-crawler)
[![Dependency Status](https://david-dm.org/bda-research/node-crawler/status.svg)](https://david-dm.org/bda-research/node-crawler)


Most powerful crawling/scraping package for Node, happy hacking :)

Features:

 * server-side DOM & automatic jQuery insertion with Cheerio (default) or JSDOM
 * Configurable pool size and retries
 * Control rate limit
 * Priority queue of requests
 * forceUTF8 mode to let crawler deal for you with charset detection and conversion

Here is the [CHANGELOG](https://github.com/bda-research/node-crawler/blob/master/CHANGELOG.md)

# How to install


    $ npm install crawler

# Crash course


```javascript
var Crawler = require("crawler");
var url = require('url');

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

# Work with `bottleneck`

Control rate limit for with limiter. All tasks submit to a limiter will abide the `rateLimit` and `maxConnections` restrictions of the limiter. `rateLimit` is the minimum time gap between two tasks. `maxConnections` is the maximum number of tasks that can be running at the same time. Limiters are independent of each other. One common use case is setting different limiters for different proxies.

To help you better understand `maxConnections`, here's an example. Say we have 10 tasks to do, `rateLimit` is set to 2000 ms, `maxConnections` is set to 3 and each task takes 10000 ms to finish. What happens will be as follows: 
```
00'----start doing task1
02'----start doing task2
04'----start doing task3
10'----task1 done, start doing task4
12'----task2 done, start doing task5
...
```

Below is an example: 

```javascript
var Crawler = require("crawler");

var c = new Crawler({
    maxConnections : 1,
    rateLimit:2000,
    callback : function (error, res, done) {
        if(error){
            console.error(error);
        }else{
            var $ = res.$;
            console.log($('title').text());
        }
        done();
    }
});

c.queue({
    uri:"http://www.google.com",
    limiter:"key1",// for connection of 'key1'
    proxy:"http://user:pass@127.0.0.1:8080"
});

c.queue({
    uri:"http://www.google.com",
    limiter:"key2", // for connection of 'key2'
    proxy:"http://user:pass@127.0.0.1:8082"
});

c.queue({
    uri:"http://www.google.com",
    limiter:"key3", // for connection of 'key3'
    proxy:"http://user:pass@127.0.0.1:8081"
});

```

# Options reference


You can pass these options to the Crawler() constructor if you want them to be global or as
items in the queue() calls if you want them to be specific to that item (overwriting global options)

This options list is a strict superset of [mikeal's request options](https://github.com/mikeal/request#requestoptions-callback) and will be directly passed to
the request() method.

Basic request options:

 * `uri`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) The url you want to crawl.
 * `timeout` : [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) In milliseconds (Default 15000).
 * [All mikeal's requests options are accepted](https://github.com/mikeal/request#requestoptions-callback).

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
 * `priority`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Priority of this request (Default 5).

Retry options:

 * `retries`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Number of retries if the request fails (Default 3),
 * `retryTimeout`: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) Number of milliseconds to wait before retrying (Default 10000),

Server-side DOM options:

 * `jQuery`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type)|[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)|[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) Use `cheerio` with default configrations to inject document if true or "cheerio". Or use customized `cheerio` if an object with [Parser options](https://github.com/fb55/htmlparser2/wiki/Parser-options). Disable injecting jQuery selector if false. If you have memory leak issue in your project, use "whacko", an alternative parser,to avoid that. (Default true)

Charset encoding:

 * `forceUTF8`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true crawler will get charset from HTTP headers or meta tag in html and convert it to UTF8 if necessary. Never worry about encoding anymore! (Default true),
 * `incomingEncoding`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) With forceUTF8: true to set encoding manually (Default null) so that crawler will not have to detect charset by itself. For example, `incomingEncoding : 'windows-1255'`. See [all supported encodings](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings)

Cache:

 * `skipDuplicates`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true skips URIs that were already crawled, without even calling callback() (Default false). __This is not recommended__, it's better to handle outside `Crawler` use [seenreq](https://github.com/mike442144/seenreq)

Other:

 * `rotateUA`: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type) If true, `userAgent` should be an array and rotate it (Default false) 
 * `userAgent`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), If `rotateUA` is false, but `userAgent` is an array, crawler will use the first one.
 * `referer`: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) If truthy sets the HTTP referer header


 
# Class:Crawler

## Event: 'schedule'
 * `options` [Options](#options-reference)

Emitted when a task is being added to scheduler.

```javascript
crawler.on('schedule',function(options){
    options.proxy = "http://proxy:port";
});
```

## Event: 'limiterChange'
 * `options` [Options](#options-reference)
 * `limiter` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)

Emitted when limiter has been changed.

## Event: 'request'
 * `options` [Options](#options-reference)

Emitted when crawler is ready to send a request.

If you are going to modify options at last stage before requesting, just listen on it.

```javascript
crawler.on('request',function(options){
    options.qs.timestamp = new Date().getTime();
});
```

## Event: 'drain'

Emitted when queue is empty.

```javascript
crawler.on('drain',function(){
    // For example, release a connection to database.
    db.end();// close connection to MySQL
});
```

## crawler.queue(uri|options)
 * `uri` [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
 * `options` [Options](#options-reference)

Enqueue a task and wait for it to be excuted.

## crawler.queueSize
 * [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)

Size of queue, read-only

 
# Working with Cheerio or JSDOM


Crawler by default use [Cheerio](https://github.com/cheeriojs/cheerio) instead of [Jsdom](https://github.com/tmpvar/jsdom). Jsdom is more robust but can be hard to install (espacially on windows) because of [contextify](https://github.com/tmpvar/jsdom#contextify).
Which is why, if you want to use jsdom you will have to build it, and `require('jsdom')` in your own script before passing it to crawler. This is to avoid cheerio crawler user to build jsdom when installing crawler.

## Working with Cheerio
```javascript
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

```javascript
{
    normalizeWhitespace: false,
    xmlMode: false,
    decodeEntities: true
}
```

For a full list of options and their effects, see [this](https://github.com/fb55/DomHandler) and
[htmlparser2's options](https://github.com/fb55/htmlparser2/wiki/Parser-options).
[source](https://github.com/cheeriojs/cheerio#loading)

## Working with JSDOM

In order to work with JSDOM you will have to install it in your project folder `npm install jsdom`, deal with [compiling C++](https://github.com/tmpvar/jsdom#contextify) and pass it to crawler.

```javascript
var jsdom = require('jsdom');
var Crawler = require('crawler');

var c = new Crawler({
    jQuery: jsdom
});
```

# How to test



## Install and run Httpbin

crawler use a local httpbin for testing purpose. You can install httpbin as a library from PyPI and run it as a WSGI app. For example, using Gunicorn:

```bash
$ pip install httpbin
# launch httpbin as a daemon with 6 worker on localhost
$ gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon
# Finally
$ npm install && npm test
```

## Alternative: Docker

After [installing Docker](http://docs.docker.com/), you can run:

```bash
# Builds the local test environment
$ docker build -t node-crawler .

# Runs tests
$ docker run node-crawler sh -c "gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon && cd /usr/local/lib/node_modules/crawler && npm install && npm test"

# You can also ssh into the container for easier debugging
$ docker run -i -t node-crawler bash
```


# Rough todolist

 * Introducing zombie to deal with page with complex ajax
 * Refactoring the code to be more maintenable
 * Make Sizzle tests pass (jsdom bug? https://github.com/tmpvar/jsdom/issues#issue/81)

# ChangeLog

See [CHANGELOG](https://github.com/bda-research/node-crawler/blob/master/CHANGELOG.md)
