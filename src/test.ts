"use strict";

import * as path from "path";
import * as util from "util";
import { EventEmitter } from "events";
import * as request from "request";
import * as _ from "lodash";
import * as cheerio from "cheerio";
import * as fs from "fs";
import Bottleneck from "bottleneckp";
import seenreq from "seenreq";
import * as iconvLite from "iconv-lite";
import * as typeis from "type-is";
import * as zlib from "zlib";
import * as qs from "querystring";
import { URL } from "url";

let http2: any;
try {
    http2 = require("http2");
} catch (e) {}

let whacko: any = null;
let level: string;
const levels = ["silly", "debug", "verbose", "info", "warn", "error", "critical"];

try {
    whacko = require("whacko");
} catch (e) {}

function defaultLog(): void {
    if (levels.indexOf(arguments[0]) >= levels.indexOf(level))
        console.log(
            new Date().toJSON() + " - " + arguments[0] + ": CRAWLER %s",
            util.format.apply(util, Array.prototype.slice.call(arguments, 1))
        );
}

function checkJQueryNaming(options: any): any {
    if ("jquery" in options) {
        options.jQuery = options.jquery;
        delete options.jquery;
    }
    return options;
}

function readJqueryUrl(url: string, callback: Function): void {
    if (url.match(/^(file:\/\/|\w+:|\/)/)) {
        fs.readFile(url.replace(/^file:\/\//, ""), "utf-8", function (err, jq) {
            callback(err, jq);
        });
    } else {
        callback(null, url);
    }
}

function contentType(res: any): string {
    return get(res, "content-type")
        .split(";")
        .filter(item => item.trim().length !== 0)
        .join(";");
}

function get(res: any, field: string): string {
    return res.headers[field.toLowerCase()] || "";
}

let log = defaultLog;

class Crawler extends EventEmitter {
    options: any;
    globalOnlyOptions: string[];
    limiters: Bottleneck.Cluster;
    http2Connections: Record<string, any>;
    seen: seenreq;

    constructor(options?: any) {
        super();
        options = options || {};
        if (["onDrain", "cache"].some(key => key in options)) {
            throw new Error(
                'Support for "onDrain", "cache" has been removed! For more details, see https://github.com/bda-research/node-crawler'
            );
        }
        this.init(options);
    }

    init(options: any): void {
        const defaultOptions = {
            autoWindowClose: true,
            forceUTF8: true,
            gzip: true,
            incomingEncoding: null,
            jQuery: true,
            maxConnections: 10,
            method: "GET",
            priority: 5,
            priorityRange: 10,
            rateLimit: 0,
            referer: false,
            retries: 3,
            retryTimeout: 10000,
            timeout: 15000,
            skipDuplicates: false,
            rotateUA: false,
            homogeneous: false,
            http2: false,
        };

        this.options = _.extend(defaultOptions, options);
        this.options = checkJQueryNaming(this.options);

        this.globalOnlyOptions = [
            "maxConnections",
            "rateLimit",
            "priorityRange",
            "priority",
            "homogeneous",
            "skipDuplicates",
            "rotateUA",
        ];

        this.limiters = new Bottleneck.Cluster(
            this.options.maxConnections,
            this.options.rateLimit,
            this.options.priorityRange,
            this.options.priority,
            this.options.homogeneous
        );

        this.http2Connections = {};

        level = this.options.debug ? "debug" : "info";

        if (this.options.logger) log = this.options.logger.log.bind(this.options.logger);

        this.log = log;

        this.seen = new seenreq(this.options.seenreq);
        this.seen
            .initialize()
            .then(() => log("debug", "seenreq is initialized."))
            .catch(e => log("error", e));

        this.on("_release", function () {
            log("debug", `Queue size: ${this.queueSize}`);

            if (this.limiters.empty) {
                if (Object.keys(self.http2Connections).length > 0) self._clearHttp2Session();
                return this.emit("drain");
            }
            return null;
        });
    }

    setLimiterProperty(limiter: any, property: string, value: any): void {
        switch (property) {
            case "rateLimit":
                this.limiters.key(limiter).setRateLimit(value);
                break;
            default:
                break;
        }
    }

    generateHttp2RequestLine(options: any): any {
        const urlObj = new URL(options.uri);

        const requestLine = {
            ":method": options.method || "GET",
            ":path": urlObj.pathname,
            ":scheme": urlObj.protocol.replace(":", ""),
            ":authority": urlObj.hostname,
        };

        return requestLine;
    }

    generateHttp2RequestBody(options: any): any {
        let data = null;
        if (options.form) {
            if (!/^application\/x-www-form-urlencoded\b/.test(options.headers["content-type"])) {
                options.headers["content-type"] = "application/x-www-form-urlencoded";
            }

            data = typeof options.form === "string" ? encodeURIComponent(options.form) : qs.stringify(options.form);
        } else if (options.json) {
            if (!/^application\/x-www-form-urlencoded\b/.test(options.headers["content-type"])) {
                data = JSON.stringify(options.body);
            }

            if (!options.headers["contentn-type"]) options.headers["content-type"] = "application/json";
        } else if (options.body !== undefined) {
            data = options.body;
        }

        // NOTE the default situation do nothing to the
        return data;
    }

    _inject(response: any, options: any, callback: Function): void {
        let $;

        if (options.jQuery === "whacko") {
            if (!whacko) {
                throw new Error("Please install whacko by your own since `crawler` detected you specify explicitly");
            }

            $ = whacko.load(response.body);
            callback(null, response, options, $);
        } else if (options.jQuery === "cheerio" || options.jQuery.name === "cheerio" || options.jQuery === true) {
            const defaultCheerioOptions = {
                normalizeWhitespace: false,
                xmlMode: false,
                decodeEntities: true,
            };
            const cheerioOptions = options.jQuery.options || defaultCheerioOptions;
            $ = cheerio.load(response.body, cheerioOptions);

            callback(null, response, options, $);
        } else if (options.jQuery.jsdom) {
            const jsdom = options.jQuery.jsdom;
            const scriptLocation = path.resolve(__dirname, "../vendor/jquery-2.1.1.min.js");

            readJqueryUrl(scriptLocation, function (err, jq) {
                if (err) return callback(err);
                jsdom.env({
                    url: options.uri,
                    src: [jq],
                    done: function (errors, window) {
                        if (errors) return callback(errors);

                        const $ = window.$;
                        callback(null, response, options, $);
                    },
                });
            });
        } else {
            callback(null, response, options);
        }
    }

    isIllegal(options: any): boolean {
        return !(options && (typeof options === "string" || typeof options === "object"));
    }

    direct(options: any, callback: Function): void {
        if (this.isIllegal(options)) {
            return callback(new Error("The options are illegal."));
        }

        const requestOptions = _.extend({}, this.options, typeof options === "string" ? { uri: options } : options);

        if (requestOptions.callback) {
            const callbackFunc = requestOptions.callback;
            requestOptions.callback = (error: any, response: any, ...args: any[]) => {
                callbackFunc(error, response, ...args);
                callback(error, response, ...args);
            };
        } else {
            requestOptions.callback = callback;
        }

        this._buildHttpRequest(requestOptions);
    }

    queue(options: any, callback?: Function): void {
        if (this.isIllegal(options)) {
            return callback(new Error("The options are illegal."));
        }

        if (typeof options === "string") {
            options = { uri: options };
        }

        if (callback) {
            options.callback = callback;
        }

        if (this.options.skipDuplicates && !this.options.http2) {
            this.seen.exists(options, (exists: boolean) => {
                if (!exists) {
                    this._pushToQueue(options);
                } else {
                    this.emit("skip", options);
                    this.emit("requestskip", options);
                }
            });
        } else {
            this._pushToQueue(options);
        }
    }

    _pushToQueue(options: any): void {
        const self = this;

        options = _.extend({}, self.options, options);

        if (!options.uri) {
            throw new Error("options.uri is a required argument");
        }

        options.qs = options.qs || options.query;

        if (options.qs) {
            options.uri += (~options.uri.indexOf("?") ? "&" : "?") + qs.stringify(options.qs);
        }

        if (options.uri.length >= 2047 && options.method === "GET") {
            options.method = "POST";
        }

        options._redirectsFollowed = options._redirectsFollowed || 0;

        if (options.headers === undefined) {
            options.headers = {};
        }

        if (!options.headers["user-agent"] && !options.headers["User-Agent"]) {
            options.headers["User-Agent"] = "crawler/" + require("../package.json").version;
        }

        if (!options.encoding) {
            options.encoding = null;
        }

        if (options.forceUTF8) {
            options.encoding = null;
        }

        if (options.encoding === "gbk") {
            options.encoding = "gb18030";
        }

        if (!options.headers.referer && !options.headers.Referer && options.referer) {
            options.headers.Referer = options.referer;
        }

        if (!options.headers.cookie && !options.headers.Cookie && options.cookies) {
            options.headers.Cookie = options.cookies;
        }

        if (options.cookieJar) {
            if (!options.jar) {
                options.jar = options.cookieJar;
            }
            delete options.cookieJar;
        }

        if (options.jar) {
            if (!options.headers.cookie && !options.headers.Cookie) {
                const cookies = options.jar.getCookieString(options.uri);
                options.headers.cookie = cookies;
            }
            delete options.jar;
        }

        if (options.debug) {
            options.log = process.stdout;
        }

        if (options.proxy && /http(s)?:\/\//.test(options.proxy)) {
            options.tunnel = true;
        }

        if (options.proxy && typeof options.proxy === "string") {
            options.proxy = url.parse(options.proxy);
        }

        if (options.skipTo2015) {
            if (!options.headers["Accept-Encoding"] && !options.headers["accept-encoding"]) {
                options.headers["Accept-Encoding"] = "gzip, deflate";
            }
            options.http2 = false;
        }

        if (options.http2) {
            if (!options.uri.startsWith("https://")) {
                throw new Error("HTTP2 only supports HTTPS requests.");
            }
            if (!http2) {
                throw new Error("http2 is not supported in this environment.");
            }
        }

        if (options.rotateUA) {
            if (typeof options.rotateUA === "object" && options.rotateUA.length > 0) {
                options.headers["User-Agent"] = options.rotateUA[0];
                options.rotateUA.push(options.rotateUA.shift());
            } else {
                throw new Error("User-Agent Rotation requires an array of User-Agents to be specified.");
            }
        }

        self.limiters.key(options.priority).submit(self._schedule.bind(self, options));
    }

    _schedule(options: any): void {
        const self = this;

        self.emit("schedule", options);

        self.limiters.schedule(options.priority, function () {
            self.emit("limiterChange", self.limiters.key(options.priority).numPendingJob(), self.queueSize);

            if (options.callback) {
                options.callback = (function (cb) {
                    return function () {
                        self.emit("request", options, arguments[0], arguments[1]);

                        if (self.options.cache) {
                            self.options.cache(options.uri, arguments[0].body);
                        }

                        if (arguments[0].statusCode !== 200) {
                            self.emit("requestfail", options, arguments[0], arguments[1]);
                        }

                        if (!options._skipEvent) {
                            self.emit("requestdone", options, arguments[0], arguments[1]);
                        }

                        if (self.options.autoWindowClose) {
                            self.emit("_release");
                        }

                        cb.apply(self, arguments);
                    };
                })(options.callback);
            }

            self.emit("request", options);
            options.uri = self._encodeURI(options.uri);
            options.uri = self._resolve(options.uri);
            options.uri = self._normalizeUrl(options.uri);
            options.uri = self._checkUrl(options.uri);

            if (!options.uri) {
                return;
            }

            if (!options.skipDuplicates) {
                self.seen.exists(options, function (exists: boolean) {
                    if (!exists) {
                        self._request(options);
                    } else {
                        self.emit("skip", options);
                        self.emit("requestskip", options);
                    }
                });
            } else {
                self._request(options);
            }
        });
    }

    _clearHttp2Session(): void {
        const self = this;
        for (const i in self.http2Connections) {
            self._closeAndDeleteHttp2Session(i);
        }
    }

    _closeAndDeleteHttp2Session(id: string): void {
        const self = this;
        self.http2Connections[id].close();
        delete self.http2Connections[id];
    }

    _request(options: any): void {
        const self = this;

        if (self.options.http2) {
            if (self.http2Connections[options.uri]) {
                self.http2Connections[options.uri].session
                    .request(options)
                    .on("response", (headers: any, flags: any) => {
                        const response = {
                            statusCode: headers[":status"],
                            headers: headers,
                        };
                        self._onResponse(options, response, (body: any) => {
                            self.http2Connections[options.uri].session.close();
                            self.emit("_release");
                            self._closeAndDeleteHttp2Session(options.uri);
                        });
                    });
            } else {
                const urlObj = new URL(options.uri);
                let http2Options = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
                    rejectUnauthorized: false,
                };
                if (options.proxy) {
                    http2Options = {
                        ...http2Options,
                        ...options.proxy,
                    };
                }

                self.http2Connections[options.uri] = {
                    session: http2.connect(`${urlObj.protocol}//${urlObj.host}`, http2Options),
                };
                self.http2Connections[options.uri].session.on("connect", () => {
                    self.http2Connections[options.uri].session
                        .request(options)
                        .on("response", (headers: any, flags: any) => {
                            const response = {
                                statusCode: headers[":status"],
                                headers: headers,
                            };
                            self._onResponse(options, response, (body: any) => {
                                self.http2Connections[options.uri].session.close();
                                self.emit("_release");
                                self._closeAndDeleteHttp2Session(options.uri);
                            });
                        });
                });
            }
            return;
        }

        if (self.options.forceUTF8) {
            options.encoding = null;
        }

        options.encoding = options.encoding || self.options.encoding || "utf-8";
        options.method = options.method || "GET";

        if (options.uri) {
            if (options.uri.href) {
                options.uri = options.uri.href;
            }
        }

        if (options.jar) {
            if (options.jar instanceof tough.CookieJar) {
                options.headers.cookie = options.jar.getCookieStringSync(options.uri);
            } else if (options.jar.getCookieString) {
                options.headers.cookie = options.jar.getCookieString(options.uri);
            }
        }

        if (options.encoding === "gbk") {
            options.encoding = "gb18030";
        }

        if (options.proxy && options.proxy instanceof url.URL) {
            options.proxy = url.format(options.proxy);
        }

        const client = self._getClient(options.uri);

        if (!client) {
            self.emit("requesterror", options, "Invalid URI");
            return;
        }

        if (self.options.debug) {
            options.log = process.stdout;
        }

        const doRequest = function () {
            client(options, function (error: any, response: any) {
                if (error) {
                    self.emit("requesterror", options, error);
                } else {
                    self._onResponse(options, response);
                }
            });
        };

        if (self.options.rateLimit) {
            self.limiters.key(options.priority).submit(doRequest);
        } else {
            doRequest();
        }
    }

    _getClient(uri: any): any {
        const protocols = {
            "http:": http,
            "https:": https,
        };

        const protocol = protocols[uri.protocol];

        if (!protocol) {
            this.emit("requesterror", { uri }, "Invalid protocol");
            return null;
        }

        return protocol;
    }

    _normalizeUrl(uri: any): any {
        if (!uri) return null;
        return url.format(url.parse(uri));
    }

    _checkUrl(uri: any): any {
        const parsed = url.parse(uri);
        if (!parsed.protocol || !parsed.hostname) {
            this.emit("requesterror", { uri }, "Invalid URI");
            return null;
        }
        return uri;
    }

    _encodeURI(uri: any): any {
        return uri.replace(/%25/g, "%2525");
    }

    _resolve(uri: any): any {
        const uriObject = url.parse(uri);

        if (!uriObject.host) {
            if (!this.options.host) {
                this.emit("requesterror", { uri }, "Both host and options.host are empty");
                return null;
            }

            uriObject.protocol = this.options.protocol ? this.options.protocol : "http:";
            uriObject.hostname = this.options.host;
            uriObject.port = this.options.port;
        }

        return url.format(uriObject);
    }

    _onResponse(options: any, response: any, done?: Function): void {
        const self = this;

        let origin = options.uri;
        options.uri = self._normalizeUrl(options.uri);
        let path;
        if (response.headers.location) {
            if (!options.followRedirect) {
                self.emit("request", options, response);
                self.emit("redirect", response.headers.location, options);

                if (self.options.autoWindowClose) {
                    self.emit("_release");
                }

                if (options.callback) {
                    options.callback(null, response, response.body);
                }

                return;
            }

            if (options._redirectsFollowed >= options.followRedirect) {
                self.emit("maxredirect", response);
                self.emit("request", options, response);

                if (self.options.autoWindowClose) {
                    self.emit("_release");
                }

                if (options.callback) {
                    options.callback(null, response, response.body);
                }

                return;
            }

            options._redirectsFollowed += 1;
            self.emit("redirect", options.uri, response.headers.location, options);
            origin = options.uri;
            options.uri = url.resolve(options.uri, response.headers.location);

            if (options.headers.cookie) {
                delete options.headers.cookie;
            }
        }

        if (options.debug) {
            log("debug", "Got " + response.statusCode + " response from " + options.uri);
        }

        if (options.encoding === null) {
            options.encoding = "utf-8";
        }

        if (options.headers["content-encoding"] === "gzip") {
            delete options.headers["content-encoding"];
            delete options.headers["Content-Encoding"];
            delete options.headers["content-length"];
            delete options.headers["Content-Length"];
            response.body = zlib.gunzipSync(response.body);
        }

        if (options.headers["content-encoding"] === "deflate") {
            delete options.headers["content-encoding"];
            delete options.headers["Content-Encoding"];
            delete options.headers["content-length"];
            delete options.headers["Content-Length"];
            response.body = zlib.inflateSync(response.body);
        }

        if (options.encoding === "gbk") {
            options.encoding = "gb18030";
        }

        if (options.encoding && options.encoding !== "utf-8") {
            response.body = iconvLite.decode(response.body, options.encoding);
        }

        if (options.jQuery || options.headers["content-type"].indexOf("html") !== -1) {
            if (!options.skipJQuery) {
                self._inject(response, options, function (err: any, res: any, $: any) {
                    if (err) {
                        self.emit("requesterror", options, err);
                    } else {
                        self.emit("request", options, res, $);
                        if (options.callback) {
                            options.callback(null, res, $);
                        }
                    }
                });
            } else {
                self.emit("request", options, response);
                if (options.callback) {
                    options.callback(null, response);
                }
            }
        } else {
            self.emit("request", options, response);
            if (options.callback) {
                options.callback(null, response, response.body);
            }
        }

        if (self.options.autoWindowClose) {
            self.emit("_release");
        }

        if (done) done(response.body);
    }

    _onDrain(): void {
        const self = this;
        self.emit("_release");
        if (!self.queueItemSize) self.emit("drain");
    }

    queueURL(uri: string, callback?: Function): void {
        if (callback) {
            const _requestOptions = {
                uri: uri,
                callback: callback,
            };
            this.queue(_requestOptions);
        } else {
            this.queue(uri);
        }
    }

    _closeHttp2Session(uri: any): void {
        const self = this;
        if (self.http2Connections[uri]) {
            self.http2Connections[uri].session.close();
            self.emit("_release");
            self._closeAndDeleteHttp2Session(uri);
        }
    }

    onIdle(): void {
        const self = this;

        if (self.limiters.empty) {
            if (Object.keys(self.http2Connections).length > 0) {
                self._clearHttp2Session();
            }
            self.emit("drain");
        } else {
            self.once("drain", function () {
                if (Object.keys(self.http2Connections).length > 0) {
                    self._clearHttp2Session();
                }
                self.emit("drain");
            });
        }
    }

    _onImmediate() {
        this.onIdle();
    }

    setLogger(logger: { log: Function }) {
        if (logger && logger.log) {
            log = logger.log.bind(logger);
        }
    }

    static version(): string {
        return require("../package.json").version;
    }

    get queueSize(): number {
        return this.limiters.key(this.options.priority).numPendingJob() + this.queueItemSize;
    }

    get queueItemSize(): number {
        return this.limiters.key(this.options.priority).numRunningJob();
    }

    get rateLimit(): number {
        return this.limiters.key(this.options.priority).rateLimit();
    }

    get rateLimitTimeRange(): number {
        return this.limiters.key(this.options.priority).rateLimitTimeRange();
    }

    clearQueue(): void {
        this.limiters.key(this.options.priority).clearQueue();
    }

    listeners(eventName: string): Function[] {
        return this.listenerCount(eventName);
    }
}

module.exports = Crawler;
