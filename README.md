[![Build Status](https://travis-ci.org/sylvinus/node-crawler.svg?branch=master)](https://travis-ci.org/sylvinus/node-crawler)

Node Crawler is not maintained at the moment (unless critical bug)
------
Have a look at alternatives modules:

* [node-spider](https://github.com/mikeal/spider)
* [node-simplecrawler](https://github.com/cgiffard/node-simplecrawler)
* [phantomJS](http://phantomjs.org/)

node-crawler
------------

node-crawler aims to be the best crawling/scraping package for Node.

It features:
 * A clean, simple API
 * server-side DOM & automatic jQuery insertion with Cheerio (default) or JSDOM
 * Configurable pool size and retries
 * Priority of requests
 * forceUTF8 mode to let node-crawler deal for you with charset detection and conversion
 * A local cache
 * node 0.10 and 0.12 support

The argument for creating this package was made at ParisJS #2 in 2010 ( [lightning talk slides](http://www.slideshare.net/sylvinus/web-crawling-with-nodejs) )

Help & Forks welcomed!

How to install
--------------

    $ npm install crawler

Crash course
------------

```javascript
var Crawler = require("crawler");
var url = require('url');

var c = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, result, $) {
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        $('a').each(function(index, a) {
            var toQueueUrl = $(a).attr('href');
            c.queue(toQueueUrl);
        });
    }
});

// Queue just one URL, with default callback
c.queue('http://joshfire.com');

// Queue a list of URLs
c.queue(['http://jamendo.com/','http://tedxparis.com']);

// Queue URLs with custom callbacks & parameters
c.queue([{
    uri: 'http://parishackers.org/',
    jQuery: false,

    // The global callback won't be called
    callback: function (error, result) {
        console.log('Grabbed', result.body.length, 'bytes');
    }
}]);

// Queue using a function
var googleSearch = function(search) {
  return 'http://www.google.fr/search?q=' + search;
};
c.queue({
  uri: googleSearch('cheese')
});

// Queue some HTML code directly without grabbing (mostly for tests)
c.queue([{
    html: '<p>This is a <strong>test</strong></p>'
}]);
```
For more examples, look at the [tests](https://github.com/sylvinus/node-crawler/tree/master/tests).

Options reference
-----------------

You can pass these options to the Crawler() constructor if you want them to be global or as
items in the queue() calls if you want them to be specific to that item (overwriting global options)

This options list is a strict superset of [mikeal's request options](https://github.com/mikeal/request#requestoptions-callback) and will be directly passed to
the request() method.

Basic request options:

 * `uri`: String, the URL you want to crawl
 * `timeout` : Number, in milliseconds        (Default 60000)
 * [All mikeal's requests options are accepted](https://github.com/mikeal/request#requestoptions-callback)

Callbacks:

 * `callback(error, result, $)`: A request was completed
 * `onDrain()`: There is no more queued requests

Pool options:

 * `maxConnections`: Number, Size of the worker pool (Default 10),
 * `priorityRange`: Number, Range of acceptable priorities starting from 0 (Default 10),
 * `priority`: Number, Priority of this request (Default 5),

Retry options:

 * `retries`: Number of retries if the request fails (Default 3),
 * `retryTimeout`: Number of milliseconds to wait before retrying (Default 10000),

Server-side DOM options:

 * `jQuery`: true, false or ConfObject (Default true)
   see below [Working with Cheerio or JSDOM](https://github.com/paulvalla/node-crawler/blob/master/README.md#working-with-cheerio-or-jsdom)

Charset encoding:

 * `forceUTF8`: Boolean, if true will try to detect the page charset and convert it to UTF8 if necessary. Never worry about encoding anymore! (Default false),
 * `incomingEncoding`: String, with forceUTF8: true to set encoding manually (Default null)
     `incomingEncoding : 'windows-1255'` for example

Cache:

 * `cache`: Boolean, if true stores requests in memory (Default false)
 * `skipDuplicates`: Boolean, if true skips URIs that were already crawled, without even calling callback() (Default false)

Other:

 * `userAgent`: String, defaults to "node-crawler/[version]"
 * `referer`: String, if truthy sets the HTTP referer header
 * `rateLimits`: Number of milliseconds to delay between each requests (Default 0) Note that this option will force crawler to use only one connection (for now)

Working with Cheerio or JSDOM
-----------------------------

Crawler by default use [Cheerio](https://github.com/cheeriojs/cheerio) instead of [Jsdom](https://github.com/tmpvar/jsdom). Jsdom is more robust but can be hard to install (espacially on windows) because of [contextify](https://github.com/tmpvar/jsdom#contextify).
Which is why, if you want to use jsdom you will have to build it, and `require('jsdom')` in your own script before passing it to crawler. This is to avoid cheerio crawler user to build jsdom when installing crawler.

###Working with Cheerio
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

###Working with JSDOM

In order to work with JSDOM you will have to install it in your project folder `npm install jsdom`, deal with [compiling C++](https://github.com/tmpvar/jsdom#contextify) and pass it to crawler.
```javascript
var jsdom = require('jsdom');
var Crawler = require('crawler');

var c = new Crawler({
    jQuery: jsdom
});
```

How to test
-----------

### Install and run Httpbin

node-crawler use a local httpbin for testing purpose. You can install httpbin as a library from PyPI and run it as a WSGI app. For example, using Gunicorn:

    $ pip install httpbin
    // launch httpbin as a daemon with 6 worker on localhost
    $ gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon

    // Finally
    $ npm install && npm test

### Alternative: Docker

After [installing Docker](http://docs.docker.com/), you can run:

    // Builds the local test environment
    $ docker build -t node-crawler .

    // Runs tests
    $ docker run node-crawler sh -c "gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon && npm install && npm test"

    // You can also ssh into the container for easier debugging
    $ docker run -i -t node-crawler bash

[![build status](https://secure.travis-ci.org/sylvinus/node-crawler.png)](http://travis-ci.org/sylvinus/node-crawler)

Rough todolist
--------------

 * Refactoring the code to be more maintenable, it's spaghetti code in there !
 * Have a look at the Cache feature and refactor it
 * Same for the Pool
 * Proxy feature
 * This issue: https://github.com/sylvinus/node-crawler/issues/118
 * Make Sizzle tests pass (jsdom bug? https://github.com/tmpvar/jsdom/issues#issue/81)
 * More crawling tests
 * Document the API more (+ the result object)
 * Option to wait for callback to finish before freeing the pool resource (via another callback like next())


ChangeLog
---------

See https://github.com/sylvinus/node-crawler/releases
