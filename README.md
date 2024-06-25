<p align="center">
  <a href="https://github.com/bda-research/node-crawler">
    <img alt="Node.js" src="https://raw.githubusercontent.com/bda-research/node-crawler/master/crawler_primary.png" width="400"/>
  </a>
</p>

------

[![npm package](https://nodei.co/npm/crawler.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/crawler/v/2.0.0)

[![CircleCI](https://circleci.com/gh/bda-research/node-crawler/tree/master.svg?style=svg)](https://circleci.com/gh/bda-research/node-crawler/tree/master)
[![NPM download][download-image]][download-url]
[![Package Quality][quality-image]][quality-url]

[quality-image]: https://packagequality.com/shield/crawler.svg
[quality-url]: https://packagequality.com/#?package=crawler
[download-image]: https://img.shields.io/npm/dm/crawler.svg?style=flat-square
[download-url]: https://npmjs.org/package/crawler

Crawler v2 : Advanced and Typescript version of [node-crawler](https://www.npmjs.com/package/crawler/v/1.5.0)

Features:

-   Server-side DOM & automatic jQuery insertion with Cheerio (default),
-   Configurable pool size and retries,
-   Control rate limit,
-   Priority queue of requests,
-   let crawler deal for you with charset detection and conversion,

If you have prior experience with Crawler v1, for fast migration, please proceed to the section [Differences and Breaking Changes](#differences-and-breaking-changes).

# Quick start

## Install

Requires Node.js 18 or above.

**IMPORTANT:**  If you are using a Linux OS, we currently recommend sticking with **Node.js version 18** for the time being, rather than opting for higher versions (even if some dependencies suggest 20 or later). Our unit tests have encountered stability issues on Linux with higher versions of Node.js, which may be caused by more profound underlying reasons. However, at present, we do not have the resources to address these issues.

```sh
$ npm install crawler
```

**Warning:** Given the dependencies involved (Especially migrating from request to got) , **Crawler v2** has been designed as a native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and no longer offers a CommonJS export. We would also like to recommend that you [convert to ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). Note that making this transition is generally not too difficult.

## Usage

### Execute asynchronously via custom options

```js
import Crawler from "crawler";

const c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: (error, res, done) => {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            console.log($("title").text());
        }
        done();
    },
});

// Add just one URL to queue, with default callback
c.add("http://www.amazon.com");

// Add a list of URLs
c.add(["http://www.google.com/", "http://www.yahoo.com"]);

// Add URLs with custom callbacks & parameters
c.add([
    {
        url: "http://parishackers.org/",
        jQuery: false,

        // The global callback won't be called
        callback: (error, res, done) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Grabbed", res.body.length, "bytes");
            }
            done();
        },
    },
]);

// Add some HTML code directly without grabbing (mostly for tests)
c.add([
    {
        html: "<title>This is a test</title>",
    },
]);
```

please refer to [options](#options) for detail.

## Slow down

Use `rateLimit` to slow down when you are visiting web sites.

```js
import Crawler from "crawler";

const c = new Crawler({
    rateLimit: 1000, // `maxConnections` will be forced to 1
    callback: (err, res, done) => {
        console.log(res.$("title").text());
        done();
    },
});

c.add(tasks); //between two tasks, minimum time gap is 1000 (ms)
```

## Custom parameters

Sometimes you have to access variables from previous request/response session, what should you do is passing parameters in **options.userParams** :

```js
c.add({
    url: "http://www.google.com",
    userParams: {
        parameter1: "value1",
        parameter2: "value2",
        parameter3: "value3",
    },
});
```

then access them in callback via `res.options`

```js
console.log(res.options.userParams);
```

## Raw body

If you are downloading files like image, pdf, word etc, you have to save the raw response body which means Crawler shouldn't convert it to string. To make it happen, you need to set encoding to null

```js
import Crawler from "crawler";
import fs from "fs";

const c = new Crawler({
    encoding: null,
    jQuery: false, // set false to suppress warning message.
    callback: (err, res, done) => {
        if (err) {
            console.error(err.stack);
        } else {
            fs.createWriteStream(res.options.userParams.filename).write(res.body);
        }
        done();
    },
});

c.add({
    url: "https://raw.githubusercontent.com/bda-research/node-crawler/master/crawler_primary.png",
    userParams: {
        filename: "crawler.png",
    },
});
```

## preRequest

If you want to do something either synchronously or asynchronously before each request, you can try the code below. Note that direct requests won't trigger preRequest.

```js
import Crawler from "crawler";

const c = new Crawler({
    preRequest: (options, done) => {
        // 'options' here is not the 'options' you pass to 'c.queue', instead, it's the options that is going to be passed to 'request' module
        console.log(options);
        // when done is called, the request will start
        done();
    },
    callback: (err, res, done) => {
        if (err) {
            console.log(err);
        } else {
            console.log(res.statusCode);
        }
    },
});

c.add({
    url: "http://www.google.com",
    // this will override the 'preRequest' defined in crawler
    preRequest: (options, done) => {
        setTimeout(() => {
            console.log(options);
            done();
        }, 1000);
    },
});
```

### Direct request

Support both Promise and callback

```js
import Crawler from "crawler";

const crawler = new Crawler();

// When using directly "send", the preRequest won't be called and the "Event:request" won't be triggered
const response = await crawler.send("https://github.com/");
console.log(response.options);
// console.log(response.body);

crawler.send({
    url: "https://github.com/",
    // When calling `send`, `callback` must be defined explicitly, with two arguments `error` and `response`
    callback: (error, response) => {
        if (error) {
            console.error(error);
        } else {
            console.log("Hello World!");
        }
    },
});
```

### 

# Table

- [Content](#content)
  - [Work with Http2](#work-with-http2)
  - [Work with rateLimiters](#work-with-ratelimiters)
  - [Class: Crawler](#class-crawler)
    - [Event: 'schedule'](#event-schedule)
    - [Event: 'limiterChange'](#event-limiterchange)
    - [Event: 'request'](#event-request)
    - [Event: 'drain'](#event-drain)
    - [crawler.add(url|options)](#crawleraddurloptions)
    - [crawler.queueSize](#crawlerqueuesize)
  - [Options](#options)
    - [Global only options](#global-only-options)
      - [`maxConnections`](#maxconnections)
      - [`priorityLevels`](#prioritylevels)
      - [`rateLimit`](#ratelimit)
      - [`skipDuplicates`](#skipduplicates)
      - [`homogeneous`](#homogeneous)
      - [`userAgents`](#useragents)
    - [Crawler General options](#crawler-general-options)
      - [`url | method | headers | body | searchParams...`](#url--method--headers--body--searchparams)
      - [`forceUTF8`](#forceutf8)
      - [`jQuery`](#jquery)
      - [`encoding`](#encoding)
      - [`rateLimiterId`](#ratelimiterid)
      - [`retries`](#retries)
      - [`retryInterval`](#retryinterval)
      - [`timeout`](#timeout)
      - [`priority`](#priority)
      - [`skipEventRequest`](#skipeventrequest)
      - [`html`](#html)
      - [`proxies`](#proxies)
      - [`proxy`](#proxy)
      - [`http2`](#http2)
      - [`referer`](#referer)
      - [`userParams`](#userparams)
      - [`preRequest`](#prerequest-1)
      - [`Callback`](#callback)
  - [Work with Cheerio](#work-with-cheerio)
- [Differences and Breaking Changes](#differences-and-breaking-changes)
  - [renaming](#renaming)
    - [Crawler Options](#crawler-options)
    - [Origin Request Options](#origin-request-options)
  - [Behavior Changes](#behavior-changes)
- [How to test](#how-to-test)


# Content

## Work with Http2

Now we offer hassle-free support for using HTTP/2: just set `http2` to true, and Crawler will operate as smoothly as with HTTP (including proxies).

**Note:** As most developers using this library with proxies also work with **Charles**, it is expected to set `rejectAuthority` to `false` in order to prevent the so-called **'self-signed certificate'** errors."

```js
crawler.send({
    url: "https://nghttp2.org/httpbin/status/200",
    method: "GET",
    http2: true,
    callback: (error, response) => {
        if (error) {
            console.error(error);
        }
        console.log(`inside callback`);
        console.log(response.body);
    },
});
```

## Work with rateLimiters

Control the rate limit. All tasks submit to a rateLimiter will abide the `rateLimit` and `maxConnections` restrictions of the limiter. `rateLimit` is the minimum time gap between two tasks. `maxConnections` is the maximum number of tasks that can be running at the same time. rateLimiters are independent of each other. One common use case is setting different rateLimiters for different proxies. One thing is worth noticing, when `rateLimit` is set to a non-zero value, `maxConnections` will be forced to 1.

```js
import Crawler from "crawler";

const c = new Crawler({
    rateLimit: 2000,
    maxConnections: 1,
    callback: (error, res, done) => {
        if (error) {
            console.log(error);
        } else {
            const $ = res.$;
            console.log($("title").text());
        }
        done();
    },
});

// if you want to crawl some website with 2000ms gap between requests
c.add("http://www.somewebsite.com/page/1");
c.add("http://www.somewebsite.com/page/2");
c.add("http://www.somewebsite.com/page/3");

// if you want to crawl some website using proxy with 2000ms gap between requests for each proxy
c.add({
    url: "http://www.somewebsite.com/page/1",
    rateLimiterId: 1,
    proxy: "proxy_1",
});
c.add({
    url: "http://www.somewebsite.com/page/2",
    rateLimiterId: 2,
    proxy: "proxy_2",
});
c.add({
    url: "http://www.somewebsite.com/page/3",
    rateLimiterId: 3,
    proxy: "proxy_3",
});
c.add({
    url: "http://www.somewebsite.com/page/4",
    rateLimiterId: 4,
    proxy: "proxy_1",
});
```

Normally, all ratelimiters instances in the limiter cluster of crawler are instantiated with options specified in crawler constructor. You can change property of any rateLimiter by calling the code below. Currently, we only support changing property 'rateLimit' of it. Note that the default rateLimiter can be accessed by `crawler.setLimiter(0, "rateLimit", 1000);`. We strongly recommend that you leave limiters unchanged after their instantiation unless you know clearly what you are doing.

```js
const crawler = new Crawler();
crawler.setLimiter(0, "rateLimit", 1000);
```

## Class: Crawler

### Event: 'schedule'

-   `options`

Emitted when a task is being added to scheduler.

```js
crawler.on("schedule", options => {
    options.proxy = "http://proxy:port";
});
```

### Event: 'limiterChange'

-   `options`
-   `rateLimiterId` : `number`

Emitted when limiter has been changed.

### Event: 'request'

-   `options`

Emitted when crawler is ready to send a request.

If you are going to modify options at last stage before requesting, just listen on it.

```js
crawler.on("request", options => {
    options.searchParams.timestamp = new Date().getTime();
});
```

### Event: 'drain'

Emitted when queue is empty.

```js
crawler.on("drain", () => {
    // For example, release a connection to database.
    db.end(); // close connection to MySQL
});
```

### crawler.add(url|options)

-   `url | options`

Add a task to queue and wait for it to be executed.

### crawler.queueSize

-   `Number`

Size of queue, read-only

## Options

You can pass these options to the **Crawler()** constructor if you want them to be global or as
items in the **crawler.add()** calls if you want them to be specific to that item (overwriting global options)

-   For using easily, simply passing a url string as Options is also accepted.
-   Options can also be an array composed of multiple options, in which case multiple tasks will be added at once.
-   When constructing options, all native [got options](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md) are accepted and passed through directly. Additionally, the options are tailored to process only those parameters that are identifiable by the Crawler.

### Global only options

#### `silence`
-   **Type:** `boolean`
-   **Default** : false
-   If true, the crawler will mute all warning and error messages. The request error will be still reported.

#### `maxConnections`

-   **Type:** `number`
-   **Default** : 10
-   The maximum number of requests that can be sent simultaneously. If the value is 10, the crawler will send at most 10 requests at the same time.

#### `priorityLevels`

-   **Type:** `number`
-   **Default** : 10
-   The number of levels of priority. Can be only assigned at the beginning.

#### `rateLimit`

-   **Type:** `number`

-   **Default** : 0

-   1000 means 1000 milliseconds delay between after the first request.

-   **Note:** This options is list as global only options because it will be set as the "default rateLimit value". This value is bound to a specific rate limiter and can **only be modified** through the `crawler.setLimiter` method. Please avoid passing redundant rateLimit property in local requests; instead, use `options.rateLimiterId` to specify a particular limiter.

-   **Example:**

    ```js
    crawler.on("schedule", options => {
        options.rateLimiterId = Math.floor(Math.random() * 15);
    });
    ```

#### `skipDuplicates`

-   **Type:** `boolean`
-   **Default** : false
-   If true, the crawler will skip duplicate tasks. If the task is already in the queue, the crawler will not add it again.

#### `homogeneous`

-   **Type:** `boolean`
-   **Default** : false
-   If true, the crawler will dynamically reallocate the tasks within the queue blocked due to header blocking to other queues.

#### `userAgents`

-   **Type:** `string | string[]`
-   **Default** : undefined
-   If passed, the crawler will rotate the user agent for each request. The "userAgents" option must be an array if activated.

### Crawler General options

#### `url | method | headers | body | searchParams...`

-   Same as the options of [options](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md)

#### `forceUTF8`

-   **Type:** `boolean`
-   **Default** : false
-   If true, the crawler will detect the charset from the HTTP headers or the meta tag in the HTML and convert it to UTF-8 if necessary.

#### `jQuery`

-   **Type:** `boolean`
-   **Default** : true
-   If true, the crawler will use the cheerio library to parse the HTML content.

#### `encoding`

-   **Type:** `string`
-   **Default** : 'utf8'
-   The encoding of the response body.

#### `rateLimiterId`

-   **Type:** `number`
-   **Default** : 0
-   The rateLimiter ID.

#### `retries`

-   **Type:** `number`
-   **Default** : 2
-   The number of retries if the request fails.

#### `retryInterval`

-   **Type:** `number`
-   **Default** : 2000
-   The number of milliseconds to wait before retrying.

#### `timeout`

-   **Type:** `number`
-   **Default** : 15000
-   The number of milliseconds to wait before the request times out.

#### `priority`

-   **Type:** `number`
-   **Default** : 5
-   The priority of the request.

#### `skipEventRequest`

-   **Type:** `boolean`
-   **Default** : false
-   If true, the crawler will not trigger the 'request' event.

#### `html`

-   **Type:** `boolean`
-   **Default** : true
-   If true, the crawler will parse the response body as HTML.

#### `proxies`

-   **Type:** `string[]`
-   **Default** : []
-   The list of proxies. If passed, the proxy will be rotated by requests.
-   **Warning:** It is recommended to avoid the usage of "proxies", better to use the following method instead. (Probably you can understand why...)

```js
const ProxyManager = {
    index: 0,
    proxies: JSON.parse(fs.readFileSync("../proxies.json")),
    setProxy: function (options) {
        let proxy = this.proxies[this.index];
        this.index = ++this.index % this.proxies.length;
        options.proxy = proxy;
        options.rateLimiterId = Math.floor(Math.random() * 15);
    },
};

crawler.on("schedule", options => {
    // options.proxy = "http://127.0.0.1:8000";
    ProxyManager.setProxy(options);
});
```

#### `proxy`

-   **Type:** `string`
-   **Default** : undefined
-   The proxy to use. The priority is higher than the "proxies" option.

#### `http2`

-   **Type:** `boolean`
-   **Default** : false
-   If true, the request will be sent in the HTTP/2 protocol.

#### `referer`

-   **Type:** `string`
-   **Default** : undefined
-   If truthy, sets the HTTP referer header.

#### `userParams`

-   **Type:** `unknown`
-   **Default** : undefined
-   The user parameters. You can access them in the callback via `res.options`.

#### `preRequest`

-   **Type:** `(options, done) => unknown`
-   **Default** : undefined
-   The function to be called before each request. Only works for the `crawler.add` method.

#### `Callback`

-   **Type:** `(error, response, done) => unknown`
-   Function that will be called after a request was completed

    -   `error`: [Error](https://nodejs.org/api/errors.html) catched by the crawler
    -   `response` :  A response of standard IncomingMessage includes `$` and `options`
        -   `response.options`: [Options](#options) of this task
        -   `response.$`: [jQuery Selector](https://api.jquery.com/category/selectors/) A selector for html or xml document.
        -   `response.statusCode`: `Number` HTTP status code. E.G.`200`
        -   `response.body`: `Buffer` | `String` | `JSON` HTTP response content which could be a html page, plain text or xml document e.g.
        -   `response.headers`: HTTP response headers
    -   `done` : The function must be called when you've done your work in callback. This is the only way to tell the crawler that the task is finished.

## Work with Cheerio

Crawler by default use [Cheerio](https://github.com/cheeriojs/cheerio). We are temporarily no longer supporting jsdom for certain reasons, may be later.

# Differences and Breaking Changes

## renaming

*Options list here are renamed but most of the old ones are still supported for backward compatibility.*

### Crawler Options
`options.priorityRange` → `options.priorityLevels`

`options.uri` → `options.url`

`options.json` → `options.isJson` (Boolean. The "json" option is now work completely different.)

`options.limiter` → `options.rateLimiterId`

`options.retryTimeout` → `options.retryInterval`

`crawler.direct` → `crawler.send`

`crawler.queue` → `crawler.add`

`crawler.setLimiterProperty` → `crawler.setLimiter`

### Origin Request Options
`incomingEncoding` → `encoding`

`qs` → `searchParams`

`strictSSL` → `rejectUnauthorized`

`gzip` → `decompress`

`jar` → `cookieJar` (accepts `tough-cookie` jar)

`jsonReviver` → `parseJson`

`jsonReplacer` → `stringifyJson`

## Behavior Changes

- default retries: 3 => 2

**Some practices that were acceptable and offen used in version 1 but not in version 2：**

-   use “jquery/JQuery/..." => **Only "jQuery" will be accepted.**
-   use "body" as the POST form => **Please use "form" instead. For more, see [options](https://github.com/sindresorhus/got/blob/main/documentation/2-options.md) .**
-   add custom options on request options => **Not allowed. Only options.userParams could pass through the response.**
-   We are temporarily no longer supporting jsdom for certain reasons.

# How to test

Crawler uses `nock` to mock http request, thus testing no longer relying on http server.

```bash
$ pnpm test
```
