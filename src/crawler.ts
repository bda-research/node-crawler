import { EventEmitter } from "events";
import { Cluster } from "./rateLimiter/index.js";
import { isBoolean, isFunction, setDefaults, flattenDeep } from "./lib/utils.js";
import { getValidOptions, alignOptions } from "./options.js";
import { logOptions } from "./logger.js";
import type { crawlerOptions, requestOptions } from "./types/crawler.js";
import { promisify } from "util";
import { load } from "cheerio";
import got from "got";
import seenreq from "seenreq";
import iconv from "iconv-lite";
import { Logger } from "tslog";

process.env.NODE_ENV = process.env.NODE_ENV ?? process.argv[2];
// test
process.env.NODE_ENV = "debug";
//
logOptions.minLevel = process.env.NODE_ENV === "debug" ? 0 : 4;
const log = new Logger(logOptions);

class Crawler extends EventEmitter {
    private _limiters: Cluster;
    private _rotatingUAIndex = 0;

    public options: crawlerOptions;
    public globalOnlyOptions: string[];
    public seen: any;

    constructor(options?: crawlerOptions) {
        super();
        const defaultOptions: crawlerOptions = {
            maxConnections: 10,
            rateLimit: 0,
            priorityLevels: 10,
            skipDuplicates: false,
            rotateUA: false,
            homogeneous: false,
            method: "GET",
            forceUTF8: true,
            incomingEncoding: null,
            jQuery: true,
            priority: 5,
            retries: 3,
            retryTimeout: 10000,
            timeout: 15000,
        };
        this.options = { ...defaultOptions, ...options };

        this.globalOnlyOptions = [
            "maxConnections",
            "rateLimit",
            "priorityLevels",
            "skipDuplicates",
            "rotateUA",
            "homogeneous",
        ];

        this._limiters = new Cluster({
            maxConnections: this.options.maxConnections as number,
            rateLimit: this.options.rateLimit as number,
            priorityLevels: this.options.priorityLevels as number,
            defaultPriority: this.options.priority as number,
            homogeneous: this.options.homogeneous,
        });

        this.seen = new seenreq(this.options.seenreq);
        this.seen
            .initialize()
            .then(() => {
                log.info("seenreq initialized");
            })
            .catch((err: any) => {
                log.error(err);
            });
        this.on("_release", () => {
            log.debug(`Queue size: ${this.queueSize}`);
            if (this._limiters.empty) this.emit("drain");
        });
    }

    private _getCharset = (headers: Record<string, string>, body: string): string => {
        let charset = "utf-8";
        const contentType = headers["content-type"];
        if (contentType) {
            const match = contentType.match(/charset=([^;]*)/);
            if (match) {
                charset = match[1].trim().toLowerCase();
            }
        }
        return charset;
    };

    private _checkHtml = (headers: Record<string, string>): boolean => {
        const contentType = headers["content-type"];
        if (/xml|html/i.test(contentType)) return true;
        return false;
    };

    private _schedule = (options: crawlerOptions): void => {
        this.emit("schedule", options);
        this._limiters.getRateLimiter(options.rateLimit).submit(options.priority as number, (done, limiter) => {
            options.release = () => {
                done();
                this.emit("_release");
            };
            options.callback = options.callback || options.release;

            if (limiter) {
                this.emit("limiterChange", options, limiter);
            }

            if (options.html) {
                options.url = options.url ?? "";
                this._handler(null, options, { body: options.html, headers: { "content-type": "text/html" } });
            } else if (typeof options.uri === "function") {
                options.uri((uri: any) => {
                    options.url = uri;
                    this._execute(options);
                });
            } else {
                options.url = options.url ?? options.uri;
                delete options.uri;
                this._execute(options);
            }
        });
    };

    private _execute = async (options: crawlerOptions): Promise<void> => {
        if (options.proxy) log.debug(`Using proxy: ${options.proxy}`);
        else if (options.proxies) log.debug(`Using proxies: ${options.proxies}`);

        options.headers = options.headers ?? {};

        if (options.forceUTF8 || options.json) options.encoding = "utf8";

        if (options.rotateUA && Array.isArray(options.userAgent)) {
            this._rotatingUAIndex = this._rotatingUAIndex % options.userAgent.length;
            options.headers["user-agent"] = options.userAgent[this._rotatingUAIndex];
            this._rotatingUAIndex++;
        } else {
            options.headers["user-agent"] = options.userAgent;
        }

        if (options.proxies) {
            options.proxy = options.proxies[Math.floor(Math.random() * options.proxies.length)];
        }

        if (isFunction(options.preRequest)) {
            try {
                options.preRequest!(options, () => { });
            } catch (err) {
                log.error(err);  
            }
        }

        if (options.skipEventRequest !== true) {
            this.emit("request", options)
        }
        try {
            const response = await got(alignOptions({ ...options }));
            return this._handler(null, options, response);
        } catch (error) {
            log.error("error:", error);
            return this._handler(error, options);
        }
    };

    private _handler = (error: any | null, options: requestOptions, response?: any): any => {
        if (error) {
            log.error(
                `${error} when fetching ${options.url} ${options.retries ? `(${options.retries} retries left)` : ""}`
            );
            if (options.retries && options.retries > 0) {
                setTimeout(() => {
                    options.retries!--;
                    this._execute(options as crawlerOptions);
                    options.release!();
                }, options.retryTimeout);
                return;
            }
            if (options.callback && typeof options.callback === "function") {
                return options.callback(error, { options }, options.release);
            }
            return void 0;
        }

        if (!response.body) response.body = "";
        log.debug("Got " + (options.url || "html") + " (" + response.body.length + " bytes)...");
        response.options = options;
        let resError = null;
        try {
            if (options.forceUTF8) {
                const charset = options.incomingEncoding || this._getCharset(response.headers, response.body);
                response.charset = charset;
                log.debug("Charset: " + charset);
                if (charset && charset !== "utf-8" && charset != "ascii") {
                    response.body = iconv.decode(response.body, charset);
                    response.body = response.body.toString();
                }
            }
        } catch (error) {
            resError = error;
        }

        if (options.jQuery === true) {
            if (response.body === "" || !this._checkHtml(response.headers)) {
                log.warn("response body is not HTML, skip injecting. Set jQuery to false to suppress this message");
            } else {
                try {
                    response.$ = load(response.body);
                } catch (err) {
                    log.error(err);
                }
            }
        }

        if (options.callback && typeof options.callback === "function") {
            return options.callback(resError, response, options.release);
        }
        return response;
    };

    private get queueSize(): number {
        return 0;
    }

    public send = async (options: string | requestOptions): Promise<any> => {
        options = getValidOptions(options) as requestOptions;
        options.retries = options.retries ?? 0;
        setDefaults(options, this.options);
        this.globalOnlyOptions.forEach(globalOnlyOption => {
            delete (options as any)[globalOnlyOption];
        });
        options.skipEventRequest = isBoolean(options.skipEventRequest) ? options.skipEventRequest : true;
        delete options.preRequest;
        return await this._execute(options as crawlerOptions);
    };
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.send()` instead.
     * @see Crawler.send
     */
    public direct = async (options: string | requestOptions): Promise<any> => {
        return await this.send(options);
    };

    public add = (options: string | requestOptions | requestOptions[]): void => {
        let optionsArray = Array.isArray(options) ? options : [options];
        optionsArray = flattenDeep(optionsArray);
        optionsArray.forEach(options => {
            try {
                options = getValidOptions(options) as requestOptions;
            } catch (err) {
                log.warn(err);
                return;
            }
            setDefaults(options, this.options);
            options.headers = { ...this.options.headers, ...options.headers };
            this.globalOnlyOptions.forEach(globalOnlyOption => {
                delete (options as any)[globalOnlyOption];
            });
            if (!this.options.skipDuplicates) {
                this._schedule(options as crawlerOptions);
                return;
            }

            this.seen
                .exists(options, options.seenreq)
                .then((rst: any) => {
                    if (!rst) {
                        this._schedule(options as crawlerOptions);
                    }
                })
                .catch((err: any) => log.error(err));
        });
    };
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.add()` instead.
     * @see Crawler.add
     */
    public queue = (options: string | requestOptions | requestOptions[]): void => {
        return this.add(options);
    };
}

export default Crawler;
