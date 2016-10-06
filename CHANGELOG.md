node-webcrawler ChangeLog
-------------------------

0.5.0 version changelog:
 * parse charset from `content-type` in http headers or meta tag in html, then convert
 * big5 charset is avaliable as the `iconv-lite` has already supported it 
 * default enable gzip in request header
 * remove unzip code in crawler since `request` will do this
 * body will return as a Buffer if encoding is null which is an option in `request`
 * remove cache and skip duplicate `request` for `GET`, `POST`(only for type `urlencode`), `HEAD`
 * add log feature, you can use `winston` to set `logger:winston`, or crawler will output to console
 * rotate user-agent in case some sites ban your requests
 
0.5.1 version changelog:
 * remove cache feature, it's useless
 * add `localAddress`, `time`, `tunnel`, `proxyHeaderWhiteList`, `proxyHeaderExclusiveList` properties to pass to `request`

0.5.2 version changelog:
 * you can manually terminate all the resources in your pool, when `onDrain` called, before their timeouts have been reached
 * add a read-only property `queueSize` to crawler
 
0.6.0 version changelog:
 * add `bottleneck` to implement rate limit, one can set limit for each connection at same time.
 
0.6.3 version changelog:
 * you could also get `result.options` from callback even when some errors ouccurred
 * add test for `bottleneck`

0.6.5
 * fix a deep and big bug when initializing Pool, that may lead to sequence execution. [issue](https://github.com/bda-research/node-webcrawler/issues/2)
 * print log of Pool status

0.6.9
 * use `bottleneckConcurrent` instead of `maxConnections`, default `10000`
 * add debug info

0.7.0
 * cancel recursion in queue
 * upgrade `request` version to v2.67.0

0.7.4
 * change `debug` option to instance level instead of `options`
 * update README.md to detail error handling
 * call `onDrain` with scope of `this`
 * upgrade `seenreq` version to 0.1.7

0.7.5
 * delete entity in options before copy, and assgin after, `jar` is one of the typical properties which is an `Entity` wich functions
 * upgrade `request` to version 2.74.0
