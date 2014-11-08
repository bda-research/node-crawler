[![Build Status](https://travis-ci.org/sylvinus/node-crawler.svg?branch=master)](https://travis-ci.org/sylvinus/node-crawler)

node-crawler
------------

node-crawler aims to be the best crawling/scraping package for Node.

It features:
 * A clean, simple API
 * server-side DOM & automatic jQuery insertion
 * Configurable pool size and retries
 * Priority of requests
 * forceUTF8 mode to let node-crawler deal for you with charset detection and conversion
 * A local cache
 * node 0.8 and 0.10 support

The argument for creating this package was made at ParisJS #2 in 2010 ( [lightning talk slides](http://www.slideshare.net/sylvinus/web-crawling-with-nodejs) )

Help & Forks welcomed!

How to install
--------------

    $ npm install crawler

Crash course
------------

```javascript
var Crawler = require("crawler");

var c = new Crawler({
    maxConnections : 10,

    // This will be called for each crawled page
    callback : function (error, result, $) {

        // $ is Cheerio by default, a lean implementation of core jQuery designed specifically for the server
        $('#content a').each(function(index, a) {
            c.queue(a.href);
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

Options reference
-----------------

You can pass these options to the Crawler() constructor if you want them to be global or as
items in the queue() calls if you want them to be specific to that item (overwriting global options)

This options list is a strict superset of [mikeal's request options](https://github.com/mikeal/request#requestoptions-callback) and will be directly passed to
the request() method.

Basic request options:

 * uri: String, the URL you want to crawl
 * timeout : Number, in milliseconds        (Default 60000)
 * method, xxx: [All mikeal's requests options are accepted](https://github.com/mikeal/request#requestoptions-callback)

Callbacks:

 * callback(error, result, $): A request was completed
 * onDrain(): There is no more queued requests

Pool options:

 * maxConnections: Number, Size of the worker pool (Default 10),
 * priorityRange: Number, Range of acceptable priorities starting from 0 (Default 10),
 * priority: Number, Priority of this request (Default 5),

Retry options:

 * retries: Number of retries if the request fails (Default 3),
 * retryTimeout: Number of milliseconds to wait before retrying (Default 10000),

Server-side DOM options:

 * jQuery: Boolean, if true creates a server-side DOM and adds jQuery (Default true)
 * jQueryUrl: String, path to the jQuery file you want to insert (Defaults to bundled jquery-1.8.1.min.js)
 * autoWindowClose: Boolean, if false you will have to close the window yourself with result.window.close(). Useful when your callback needs to continue having the window open until some async code has ran. (Default true)

Charset encoding:

 * forceUTF8: Boolean, if true will try to detect the page charset and convert it to UTF8 if necessary. Never worry about encoding anymore! (Default false),
 * incomingEncoding: String, with forceUTF8: true to set encoding manually (Default null)
     `incomingEncoding : 'windows-1255'` for example

Cache:

 * cache: Boolean, if true stores requests in memory (Default false)
 * skipDuplicates: Boolean, if true skips URIs that were already crawled, without even calling callback() (Default false)

Other:

 * userAgent: String, defaults to "node-crawler/[version]"
 * referer: String, if truthy sets the HTTP referer header
 * rateLimits: Number of milliseconds to delay between each requests (Default 0) Note that this option will force crawler to use only one connection (for now)

How to test
-----------

### Install and run Httpbin

node-crawler use a local httpbin for testing purpose. You can install httpbin as a library from PyPI and run it as a WSGI app. For example, using Gunicorn:

    $ pip install httpbin
    // launch httpbin as a daemon with 6 worker on localhost
    $ gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon

    // Finally
    $ npm install && npm test


[![build status](https://secure.travis-ci.org/sylvinus/node-crawler.png)](http://travis-ci.org/sylvinus/node-crawler)

Rough todolist
--------------

 * Refactoring the code to be more maintenable, it's spaghetti code in there !
 * Have a look at the Cache feature and refactor it
 * Same for the Pool
 * Make Sizzle tests pass (jsdom bug? https://github.com/tmpvar/jsdom/issues#issue/81)
 * More crawling tests
 * Document the API more (+ the result object)
 * Option to wait for callback to finish before freeing the pool resource (via another callback like next())


ChangeLog
---------

See https://github.com/sylvinus/node-crawler/releases
