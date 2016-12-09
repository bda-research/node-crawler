node-webcrawler ChangeLog
-------------------------

1.0.0
 * upgrade jsdom up to 9.6.x
 * remove 0.10 and 0.12 support [#170](https://github.com/bda-research/node-crawler/issues/170)
 * control dependencies version using ^ and ~ [#169](https://github.com/bda-research/node-crawler/issues/169)
 * remove node-pool
 * notify bottleneck until a task is completed
 * replace bottleneck by bottleneckp, which has priority
 * change default log function
 * use event listener on `request` and `drain` instead of global function [#144](https://github.com/bda-research/node-crawler/issues/144)
 * default set forceUTF8 to true
 * detect `ESOCKETTIMEDOUT` instead of `ETIMEDOUT` when timeout in test
 * add `done` function in callback to avoid async trap
 * do not convert response body to string if `encoding` is null [#118](https://github.com/bda-research/node-crawler/issues/118)
 * add result document [#68](https://github.com/bda-research/node-crawler/issues/68) [#116](https://github.com/bda-research/node-crawler/issues/116)
 * add event `schedule` which is emitted when a task is being added to scheduler
 * in callback, move $ into `res` because of weird API
 * change rateLimits to rateLimit
 
0.7.5
 * delete entity in options before copy, and assgin after, `jar` is one of the typical properties which is an `Entity` wich functions [#177](https://github.com/bda-research/node-crawler/issues/177)
 * upgrade `request` to version 2.74.0

0.7.4
 * change `debug` option to instance level instead of `options`
 * update README.md to detail error handling
 * call `onDrain` with scope of `this`
 * upgrade `seenreq` version to 0.1.7

0.7.0
 * cancel recursion in queue
 * upgrade `request` version to v2.67.0

0.6.9
 * use `bottleneckConcurrent` instead of `maxConnections`, default `10000`
 * add debug info

0.6.5
 * fix a deep and big bug when initializing Pool, that may lead to sequence execution. [#2](https://github.com/bda-research/node-webcrawler/issues/2)
 * print log of Pool status

0.6.3
 * you could also get `result.options` from callback even when some errors ouccurred [#127](https://github.com/bda-research/node-crawler/issues/127) [#86](https://github.com/bda-research/node-crawler/issues/86)
 * add test for `bottleneck`

0.6.0
 * add `bottleneck` to implement rate limit, one can set limit for each connection at same time.
 
0.5.2
 * you can manually terminate all the resources in your pool, when `onDrain` called, before their timeouts have been reached
 * add a read-only property `queueSize` to crawler [#148](https://github.com/bda-research/node-crawler/issues/148) [#76](https://github.com/bda-research/node-crawler/issues/76) [#107](https://github.com/bda-research/node-crawler/issues/107)
 
0.5.1
 * remove cache feature, it's useless
 * add `localAddress`, `time`, `tunnel`, `proxyHeaderWhiteList`, `proxyHeaderExclusiveList` properties to pass to `request` [#155](https://github.com/bda-research/node-crawler/issues/155)

0.5.0
 * parse charset from `content-type` in http headers or meta tag in html, then convert
 * big5 charset is avaliable as the `iconv-lite` has already supported it 
 * default enable gzip in request header
 * remove unzip code in crawler since `request` will do this
 * body will return as a Buffer if encoding is null which is an option in `request`
 * remove cache and skip duplicate `request` for `GET`, `POST`(only for type `urlencode`), `HEAD`
 * add log feature, you can use `winston` to set `logger:winston`, or crawler will output to console
 * rotate user-agent in case some sites ban your requests
 
