import { EventEmitter } from "events";
import { RateLimiter, Cluster } from "./rateLimiter/index.js";
import { getType, isValidUrl, isFunction, setDefaults, flattenDeep } from "./lib/utils.js";
import type { crawlerOptions, requestOptions } from "./types/crawler.js";
import { promisify } from "util";
import got from "got";
import seenreq from "seenreq";

// 定义 Crawler 类
class Crawler extends EventEmitter {
    private _limiters: Cluster;

    public options: crawlerOptions;
    public globalOnlyOptions: string[];
    public seen: any;

    constructor(options: crawlerOptions) {
        super();
        const defaultOptions: crawlerOptions = {
            forceUTF8: true,
            gzip: true,
            incomingEncoding: null,
            jQuery: true,
            maxConnections: 10,
            method: "GET",
            priority: 5,
            priorityCount: 10,
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
        this.options = { ...defaultOptions, ...options };
        // Don't make these options persist to individual queries
        // self.globalOnlyOptions = ['maxConnections', 'rateLimit', 'priorityRange', 'homogeneous', 'skipDuplicates', 'rotateUA'];
        this.globalOnlyOptions = ["skipDuplicates", "rotateUA"];

        this._limiters = new Cluster({
            maxConnections: this.options.maxConnections,
            rateLimit: this.options.rateLimit,
            priorityCount: this.options.priorityCount,
            defaultPriority: this.options.priority,
            homogeneous: this.options.homogeneous,
        });

        // this.on("_release", () => {
        //     this.log("debug", `Queue size: ${this.queueSize}`);

        //     if (this.limiters.empty) {
        //         if (Object.keys(this.http2Connections).length > 0) {
        //             this._clearHttp2Session();
        //         }
        //         this.emit("drain");
        //     }
        // });
    }
    private _getValidOptions = (options: unknown): Object => {
        const type = getType(options);
        if (type === "string") {
            try {
                if (isValidUrl(options as string)) return { uri: options };
                options = JSON.parse(options as string);
                return options as Object;
            } catch (e) {
                throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
            }
        } else if (type === "object") {
            const prototype = Object.getPrototypeOf(options);
            if (prototype === Object.prototype || prototype === null) return options as Object;
        }
        throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
    };

    public send = async (options: requestOptions): Promise<void> => {
        options = this._getValidOptions(options) as requestOptions;
        setDefaults(options, this.options);
        return this._execute(options);
    };
    /**
     * Old interface version. It is recommended to use `Crawler.send()` instead.
     *
     * @see Crawler.send
     */
    public direct = async (options: requestOptions): Promise<void> => {
        return this.send(options);
    };

    public add = async (options: requestOptions | requestOptions[]): Promise<void> => {
        let optionsArray = Array.isArray(options) ? options : [options];
        optionsArray = flattenDeep(optionsArray);
        optionsArray.forEach(options => {
            try {
                options = this._getValidOptions(options) as requestOptions;
                setDefaults(options, this.options);
                options.headers = { ...this.options.headers, ...options.headers };
                this.globalOnlyOptions.forEach(globalOnlyOption => {
                    delete (options as any)[globalOnlyOption];
                });
                if (!this.options.skipDuplicates) {
                    this._schedule(options);
                }
                this.seen
                    .exists(options, options.seenreq)
                    .then((rst: any) => {
                        if (!rst) {
                            this._schedule(options);
                        }
                    })
                    .catch((err: any) => console.error(err));
            } catch (err) {
                console.warn(err);
            }
        });
    };

    private _schedule = async (options: requestOptions): Promise<void> => {
        this.emit("schedule", options);
        this._limiters.getRateLimiter(options.rateLimit).submit(options.priority, (done, limiter) => {
            options.release = () => {
                done();
                this.emit("_release");
            };
            options.callback = options.callback || options.release;

            if (limiter) {
                this.emit("limiterChange", options, limiter);
            }

            if (options.html) {
                this._onContent(null, options, { body: options.html, headers: { "content-type": "text/html" } });
            } else if (typeof options.uri === "function") {
                options.uri(uri => {
                    options.uri = uri;
                    this._execute(options);
                });
            } else {
                this._execute(options);
            }
        });
    };

    private _execute = async (options: Partial<requestOptions>): Promise<void> => {
        const reqOptions = { ...options };
        reqOptions.headers = reqOptions.headers ?? {};
        if (reqOptions.forceUTF8 || reqOptions.json) reqOptions.encoding = null;
        if (reqOptions.rotateUA && Array.isArray(reqOptions.userAgent)) {
            reqOptions.headers["user-agent"] =
                reqOptions.userAgent[Math.floor(Math.random() * reqOptions.userAgent.length)];
        } else {
            reqOptions.headers["user-agent"] = reqOptions.userAgent;
        }

        if (reqOptions.referer) {
            reqOptions.headers.referer = reqOptions.referer;
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
        if (reqOptions.skipEventRequest !== true) {
            this.emit("request", reqOptions);
        }
        try {
            const response = await got(reqOptions.uri, reqOptions);
            this._handler((error = null), reqOptions, response);
        } catch (error) {
            console.log("error:", error);
            this._handler(error, reqOptions);
        }
    };
    private _handler = (error: Error | null, options: requestOptions, response?: any): void => {
        if (error) {
            options.callback(error, { options: options }, options.release);
            // switch (error.code) {
            //     case "NOHTTP2SUPPORT":
            //         //if the enviroment is not support http2 api, all request rely on http2 protocol
            //         //are aborted immediately no matter how many retry times left
            //         log(
            //             "error",
            //             "Error " + error + " when fetching " + (options.uri || options.url) + " skip all retry times"
            //         );
            //         break;
            //     default:
            //         log(
            //             "error",
            //             "Error " +
            //                 error +
            //                 " when fetching " +
            //                 (options.uri || options.url) +
            //                 (options.retries ? " (" + options.retries + " retries left)" : "")
            //         );
            //         if (options.retries) {
            //             setTimeout(function () {
            //                 options.retries--;
            //                 self._schedule(options);
            //                 options.release();
            //             }, options.retryTimeout);
            //             return;
            //         }
            //         break;
            // }
            return;
        }

        if (!response.body) {
            response.body = "";
        }
        console.debug("Got " + (options.uri || "html") + " (" + response.body.length + " bytes)...");

        try {
            self._doEncoding(options, response);
        } catch (e) {
            return options.callback(e, { options: options }, options.release);
        }

        response.options = options;

        if (options.method === "HEAD" || !options.jQuery) {
            return options.callback(null, response, options.release);
        }

        const injectableTypes = ["html", "xhtml", "text/xml", "application/xml", "+xml"];
        if (!options.html && !typeis(contentType(response), injectableTypes)) {
            log("warn", "response body is not HTML, skip injecting. Set jQuery to false to suppress this message");
            return options.callback(null, response, options.release);
        }
        
    };
    private get queueSize(): number {
        return 0;
    }
}

export default Crawler;
