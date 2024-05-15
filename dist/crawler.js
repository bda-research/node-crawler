import { EventEmitter } from "events";
import { Cluster } from "./rateLimiter/index.js";
import { isBoolean, isFunction, setDefaults, flattenDeep, lowerObjectKeys, isNumber } from "./lib/utils.js";
import { getValidOptions, alignOptions, getCharset } from "./options.js";
import { logOptions } from "./logger.js";
import { load } from "cheerio";
import got from "got";
import seenreq from "seenreq";
import iconv from "iconv-lite";
import { Logger } from "tslog";
process.env.NODE_ENV = process.env.NODE_ENV ?? process.argv[2];
// process.env.NODE_ENV = "debug";
logOptions.minLevel = process.env.NODE_ENV === "debug" ? 0 : 3;
const log = new Logger(logOptions);
class Crawler extends EventEmitter {
    constructor(options) {
        super();
        this._UAIndex = 0;
        this._proxyIndex = 0;
        this._detectHtmlOnHeaders = (headers) => {
            const contentType = headers["content-type"];
            if (/xml|html/i.test(contentType))
                return true;
            return false;
        };
        this._schedule = (options) => {
            this.emit("schedule", options);
            this._limiters.getRateLimiter(options.rateLimiterId).submit(options.priority, (done, rateLimiterId) => {
                options.release = () => {
                    done();
                    this.emit("_release");
                };
                options.callback = options.callback || options.release;
                if (rateLimiterId) {
                    this.emit("limiterChange", options, rateLimiterId);
                }
                if (options.html) {
                    options.url = options.url ?? "";
                    this._handler(null, options, { body: options.html, headers: { "content-type": "text/html" } });
                }
                else if (typeof options.uri === "function") {
                    options.uri((uri) => {
                        options.url = uri;
                        this._execute(options);
                    });
                }
                else {
                    options.url = options.url ?? options.uri;
                    delete options.uri;
                    this._execute(options);
                }
            });
        };
        this._execute = async (options) => {
            if (options.proxy)
                log.debug(`Using proxy: ${options.proxy}`);
            else if (options.proxies)
                log.debug(`Using proxies: ${options.proxies}`);
            options.headers = options.headers ?? {};
            options.headers = lowerObjectKeys(options.headers);
            if (options.forceUTF8 || options.isJson)
                options.encoding = "utf8";
            if (Array.isArray(options.userAgents)) {
                this._UAIndex = this._UAIndex % options.userAgents.length;
                options.headers["user-agent"] = options.userAgents[this._UAIndex];
                this._UAIndex++;
            }
            else {
                options.headers["user-agent"] = options.headers["user-agent"] ?? options.userAgents;
            }
            if (!options.proxy && Array.isArray(options.proxies)) {
                this._proxyIndex = this._proxyIndex % options.proxies.length;
                options.proxy = options.proxies[this._proxyIndex];
                this._proxyIndex++;
            }
            const request = async () => {
                if (options.skipEventRequest !== true) {
                    this.emit("request", options);
                }
                let response;
                try {
                    response = await got(alignOptions(options));
                }
                catch (error) {
                    log.debug(error);
                    return this._handler(error, options);
                }
                return this._handler(null, options, response);
            };
            if (isFunction(options.preRequest)) {
                try {
                    options.preRequest(options, async (err) => {
                        if (err) {
                            log.debug(err);
                            return this._handler(err, options);
                        }
                        return await request();
                    });
                }
                catch (err) {
                    log.error(err);
                    throw err;
                }
            }
            else {
                return await request();
            }
        };
        this._handler = (error, options, response) => {
            if (error) {
                if (options.retries && options.retries > 0) {
                    log.warn(`${error} when fetching ${options.url} ${options.retries ? `(${options.retries} retries left)` : ""}`);
                    setTimeout(() => {
                        options.retries--;
                        this._execute(options);
                    }, options.retryInterval);
                    return;
                }
                else {
                    log.error(`${error} when fetching ${options.url}. Request failed.`);
                    if (options.callback && typeof options.callback === "function") {
                        return options.callback(error, { options }, options.release);
                    }
                    throw error;
                }
            }
            if (!response.body)
                response.body = "";
            log.debug("Got " + (options.url || "html") + " (" + response.body.length + " bytes)...");
            response.options = options;
            response.charset = getCharset(response.headers);
            if (!response.charset) {
                const match = response.body.toString().match(/charset=['"]?([\w.-]+)/i);
                response.charset = match ? match[1].trim().toLowerCase() : null;
            }
            log.debug("Charset: " + response.charset);
            if (options.encoding !== null) {
                options.encoding = options.encoding ?? response.charset ?? "utf8";
                try {
                    if (!Buffer.isBuffer(response.body))
                        response.body = Buffer.from(response.body);
                    response.body = iconv.decode(response.body, options.encoding);
                    response.body = response.body.toString();
                }
                catch (err) {
                    log.error(err);
                }
            }
            if (options.isJson) {
                try {
                    response.body = JSON.parse(response.body);
                }
                catch (err) {
                    log.warn("JSON parsing failed, body is not JSON. Set isJson to false to mute this warning.");
                }
            }
            if (options.jQuery === true) {
                if (response.body === "" || !this._detectHtmlOnHeaders(response.headers)) {
                    log.warn("response body is not HTML, skip injecting. Set jQuery to false to mute this warning.");
                }
                else {
                    try {
                        response.$ = load(response.body);
                    }
                    catch (err) {
                        log.warn("HTML detected failed. Set jQuery to false to mute this warning.");
                    }
                }
            }
            if (options.callback && typeof options.callback === "function") {
                return options.callback(null, response, options.release);
            }
            return response;
        };
        /**
         *
         * @param options
         * @returns if there is a "callback" function in the options, return the result of the callback function. \
         * Otherwise, return a promise, which resolves when the request is successful and rejects when the request fails.
         * In the case of the promise, the resolved value will be the response object.
         * @description Send a request directly.
         * @example
         * ```js
         * const crawler = new Crawler();
         * crawler.send({
         *      url: "https://example.com",
         *      callback: (error, response, done) => { done(); }
         * });
         * await crawler.send("https://example.com");
         * ```
         */
        this.send = async (options) => {
            options = getValidOptions(options);
            options.retries = options.retries ?? 0;
            setDefaults(options, this.options);
            this.globalOnlyOptions.forEach(globalOnlyOption => {
                delete options[globalOnlyOption];
            });
            options.skipEventRequest = isBoolean(options.skipEventRequest) ? options.skipEventRequest : true;
            delete options.preRequest;
            return await this._execute(options);
        };
        /**
         * @deprecated
         * @description Old interface version. It is recommended to use `Crawler.send()` instead.
         * @see Crawler.send
         */
        this.direct = async (options) => {
            return await this.send(options);
        };
        /**
         *
         * @param options
         * @description Add a request to the queue.
         * @example
         * ```js
         * const crawler = new Crawler();
         * crawler.add({
         *     url: "https://example.com",
         *     callback: (error, response, done) => { done(); }
         * });
         * ```
         */
        this.add = (options) => {
            let optionsArray = Array.isArray(options) ? options : [options];
            optionsArray = flattenDeep(optionsArray);
            optionsArray.forEach(options => {
                try {
                    options = getValidOptions(options);
                }
                catch (err) {
                    log.warn(err);
                    return;
                }
                setDefaults(options, this.options);
                options.headers = { ...this.options.headers, ...options.headers };
                this.globalOnlyOptions.forEach(globalOnlyOption => {
                    delete options[globalOnlyOption];
                });
                if (!this.options.skipDuplicates) {
                    try {
                        this._schedule(options);
                    }
                    catch (err) { }
                    return;
                }
                this.seen
                    .exists(options, options.seenreq)
                    .then((rst) => {
                    if (!rst) {
                        try {
                            this._schedule(options);
                        }
                        catch (err) { }
                    }
                })
                    .catch((error) => log.error(error));
            });
        };
        /**
         * @deprecated
         * @description Old interface version. It is recommended to use `Crawler.add()` instead.
         * @see Crawler.add
         */
        this.queue = (options) => {
            return this.add(options);
        };
        const defaultOptions = {
            maxConnections: 10,
            rateLimit: 0,
            priorityLevels: 10,
            skipDuplicates: false,
            homogeneous: false,
            method: "GET",
            forceUTF8: false,
            jQuery: true,
            priority: 5,
            retries: 2,
            retryInterval: 2000,
            timeout: 15000,
            isJson: false,
        };
        this.options = { ...defaultOptions, ...options };
        this.globalOnlyOptions = [
            "maxConnections",
            "rateLimit",
            "priorityLevels",
            "skipDuplicates",
            "homogeneous",
            "userAgents",
        ];
        this._limiters = new Cluster({
            maxConnections: this.options.maxConnections,
            rateLimit: this.options.rateLimit,
            priorityLevels: this.options.priorityLevels,
            defaultPriority: this.options.priority,
            homogeneous: this.options.homogeneous,
        });
        this.seen = new seenreq(this.options.seenreq);
        this.seen
            .initialize()
            .then(() => {
            log.debug("seenreq initialized");
        })
            .catch((error) => {
            log.error(error);
        });
        this.on("_release", () => {
            log.debug(`Queue size: ${this.queueSize}`);
            if (this._limiters.empty)
                this.emit("drain");
        });
    }
    get queueSize() {
        return 0;
    }
    /**
     *
     * @param rateLimiterId
     * @param property
     * @param value
     * @description Set the rate limiter property.
     * @version 2.0.0 Only support `rateLimit` change.
     * @example
     * ```js
     * const crawler = new Crawler();
     * crawler.setLimiter(0, "rateLimit", 1000);
     * ```
     */
    setLimiter(rateLimiterId, property, value) {
        if (!isNumber(rateLimiterId)) {
            log.error("rateLimiterId must be a number");
            return;
        }
        if (property === "rateLimit") {
            this._limiters.getRateLimiter(rateLimiterId).setRateLimit(value);
        }
        // @todo other properties
    }
}
export default Crawler;
//# sourceMappingURL=crawler.js.map