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

The argument for creating this package was made at ParisJS #2 in 2010 ( [lightning talk slides](http://www.slideshare.net/sylvinus/web-crawling-with-nodejs) )

Help & Forks welcomed!

How to install
--------------

    $ npm install crawler


Crash course
------------

```javascript
var Crawler = require("crawler").Crawler;

var c = new Crawler({
"maxConnections":10,

// This will be called for each crawled page
"callback":function(error,result,$) {

    // $ is a jQuery instance scoped to the server-side DOM of the page
    $("#content a").each(function(index,a) {
        c.queue(a.href);
    });
}
});

// Queue just one URL, with default callback
c.queue("http://joshfire.com");

// Queue a list of URLs
c.queue(["http://jamendo.com/","http://tedxparis.com"]);

// Queue URLs with custom callbacks & parameters
c.queue([{
"uri":"http://parishackers.org/",
"jQuery":false,

// The global callback won't be called
"callback":function(error,result) {
    console.log("Grabbed",result.body.length,"bytes");
}
}]);

// Queue some HTML code directly without grabbing (mostly for tests)
c.queue([{
"html":"<p>This is a <strong>test</strong></p>"
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

Cache:

 * cache: Boolean, if true stores requests in memory (Default false)
 * skipDuplicates: Boolean, if true skips URIs that were already crawled, without even calling callback() (Default false)

Other:

 * userAgent: String, defaults to "node-crawler/[version]"


Memory leaks
------------

When using timeouts, to avoid triggering [Node #3076](https://github.com/joyent/node/pull/3076) you should use Node > 0.8.14

There is now a complete memory leak test for node-crawler :)


How to test
-----------

    $ npm install && npm test

Feel free to add more tests!

[![build status](https://secure.travis-ci.org/sylvinus/node-crawler.png)](http://travis-ci.org/sylvinus/node-crawler)

Rough todolist
--------------

 * Make Sizzle tests pass (jsdom bug? https://github.com/tmpvar/jsdom/issues#issue/81)
 * More crawling tests
 * Document the API more (+ the result object)
 * Get feedback on featureset for a 1.0 release (option for autofollowing links?)
 * Check how we can support other mimetypes than HTML
 * Option to wait for callback to finish before freeing the pool resource (via another callback like next())


ChangeLog
---------

0.2.5
 - Fix `options.encoding = null`, thanks @trantorLiu
 - Basic auth support, thanks @luap
 - Updated jsdom dependency to 0.8.2 + others, Node 0.10.x support, thanks @bkw
 - Highlight code in docs, thanks @namuol
 - Detect non-html responses
 - Proxy list support

0.2.4
 - Fixed a bug with response.body being a Buffer in some cases
 - Wrapped jsdom calls in a try/catch to isolate us from crashes

0.2.3
 - Added gzip support
 - Support for userAgent option
 - Added fallback on iconv-lite and marked iconv as optional dependency

0.2.2
 - Fix relative link bug, all a.href should be absolute when crawling a remote URL
 - Updated default jQuery to 1.8.3, request to 2.12.0, genericpool to 2.0.2
 - Fixed memory leak by adding the autoWindowClose option
 - Added memory leak test

0.2.1
 - Updated jsdom to 0.2.19

0.2.0
 - Updated code & dependencies for node 0.6/0.8, cleaned package.json
 - Added a forceUTF8 mode
 - Added real unit tests & travis-ci
 - Added some docs!
 - Added onDrain()
 - Code refactor
 - [BACKWARD-INCOMPATIBLE] Timeout parameters now in milliseconds (weren't documented)

0.1.0
 - Updated dependencies, notably node 0.4.x
 - Fixes jQuery being redownloaded at each page + include it in the tree
 - Cache support
 - Retries
 - Updated priority support with new generic-pool>=1.0.4
