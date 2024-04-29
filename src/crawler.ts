import { EventEmitter } from "events";
import { Cluster } from "./rateLimiter/index.js";
import { isFunction, setDefaults, flattenDeep } from "./lib/utils.js";
import { getValidOptions, alignOptions } from "./options.js";
import type { crawlerOptions, requestOptions } from "./types/crawler.js";
import { promisify } from "util";
import got from "got";
import seenreq from "seenreq";
import iconv from "iconv-lite";
import cheerio from "cheerio";

process.env.NODE_ENV = process.env.NODE_ENV ?? process.argv[2] ?? "debug";

if (process.env.NODE_ENV !== "debug") {
    console.log = () => { };
    console.error = () => { };
    console.debug = () => { };
}

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
            maxConnections: this.options.maxConnections,
            rateLimit: this.options.rateLimit,
            priorityLevels: this.options.priorityLevels,
            defaultPriority: this.options.priority as number,
            homogeneous: this.options.homogeneous,
        });

        this.seen = new seenreq(this.options.seenreq);
        this.seen
            .initialize()
            .then(() => {
                console.log("seenreq initialized");
            })
            .catch((err: any) => {
                console.error(err);
            });
        this.on("_release", () => {
            console.debug(`Queue size: ${this.queueSize}`);
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

    // private _getContentType = (headers: Record<string, string>): string[] => {
    //     let contentType = headers["content-type"];
    //     if (!contentType) return [];
    //     return contentType.split(";").map((type: string) => type.trim());
    // }

    private _schedule = async (options: crawlerOptions): Promise<void> => {
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
                this._handler(null, options, { body: options.html, headers: { "content-type": "text/html" } });
            } else if (typeof options.uri === "function") {
                options.uri((uri: any) => {
                    options.uri = uri;
                    this._execute(options);
                });
            } else {
                this._execute(options);
            }
        });
    };

    private _execute = async (options: crawlerOptions): Promise<void> => {
        const reqOptions = { ...options } as crawlerOptions;

        if (options.proxy) console.debug(`Using proxy: ${options.proxy}`);
        else if (options.proxies) console.debug(`Using proxies: ${options.proxies}`);

        reqOptions.headers = reqOptions.headers ?? {};

        if (reqOptions.forceUTF8 || reqOptions.json) reqOptions.encoding = null;

        if (reqOptions.rotateUA && Array.isArray(reqOptions.userAgent)) {
            this._rotatingUAIndex = this._rotatingUAIndex % reqOptions.userAgent.length;
            reqOptions.headers["user-agent"] = reqOptions.userAgent[this._rotatingUAIndex];
            this._rotatingUAIndex++;
        } else {
            reqOptions.headers["user-agent"] = reqOptions.userAgent;
        }

        if (reqOptions.proxies) {
            reqOptions.proxy = reqOptions.proxies[Math.floor(Math.random() * reqOptions.proxies.length)];
        }

        if (isFunction(reqOptions.preRequest)) {
            try {
                await promisify(reqOptions.preRequest as any)(reqOptions);
            } catch (err) {
                console.error(err);
            }
        }

        // @todo skipEventRequest

        try {
            const response = await got(alignOptions(reqOptions));
            return this._handler(null, reqOptions, response);
        } catch (error) {
            console.log("error:", error);
            return this._handler(error, reqOptions);
        }
    };

    private _handler = (error: any | null, options: requestOptions, response?: any): any => {
        if (error) {
            console.log(
                `Error: ${error} when fetching ${options.uri} ${options.retries ? `(${options.retries} retries left)` : ""
                }`
            );
            if (options.retries) {
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
        console.debug("Got " + (options.url || "html") + " (" + response.body.length + " bytes)...");
        response.options = options;
        let resError = null;
        try {
            if (options.forceUTF8) {
                const charset = options.incomingEncoding || this._getCharset(response.headers, response.body);
                response.charset = charset;
                console.debug("Charset: " + charset);
                if (charset && charset !== "utf-8" && charset != "ascii") {
                    response.body = iconv.decode(response.body, charset);
                    response.body = response.body.toString();
                }
            }
        } catch (error) {
            resError = error;
        }

        // @todo: jQuery injection

        // const injectableTypes = ["html", "xhtml", "text/xml", "application/xml", "+xml"];
        // if (this._getContentType(response.headers).some(type => injectableTypes.includes(type))) {
        //     console.warn("response body is not HTML, skip injecting. Set jQuery to false to suppress this message");
        // }

        if (options.callback && typeof options.callback === "function") {
            return options.callback(resError, response, options.release);
        }
        return response;
    };

    private get queueSize(): number {
        return 0;
    }

    public send = async (options: requestOptions): Promise<any> => {
        options = getValidOptions(options) as requestOptions;
        options.retries = options.retries ?? 0;
        setDefaults(options, this.options);
        this.globalOnlyOptions.forEach(globalOnlyOption => {
            delete (options as any)[globalOnlyOption];
        });
        return await this._execute(options as crawlerOptions);
    };
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.send()` instead.
     * @see Crawler.send
     */
    public direct = async (options: requestOptions): Promise<any> => {
        return await this.send(options);
    };

    public add = async (options: requestOptions | requestOptions[]): Promise<void> => {
        let optionsArray = Array.isArray(options) ? options : [options];
        optionsArray = flattenDeep(optionsArray);
        optionsArray.forEach(options => {
            try {
                options = getValidOptions(options) as requestOptions;
            } catch (err) {
                console.warn(err);
                return;
            }
            setDefaults(options, this.options);
            options.headers = { ...this.options.headers, ...options.headers };
            this.globalOnlyOptions.forEach(globalOnlyOption => {
                delete (options as any)[globalOnlyOption];
            });
            if (!this.options.skipDuplicates) {
                this._schedule(options as crawlerOptions);
            }

            this.seen
                .exists(options, options.seenreq)
                .then((rst: any) => {
                    if (!rst) {
                        this._schedule(options as crawlerOptions);
                    }
                })
                .catch((err: any) => console.error(err));
        });
    };
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.add()` instead.
     * @see Crawler.add
     */
    public queue = async (options: requestOptions | requestOptions[]): Promise<void> => {
        return this.add(options);
    };
}

export default Crawler;
