import { EventEmitter } from "events";
import got from "got";
import { RateLimiter, Cluster } from "./rateLimiter/index.js";
import { getType, isValidUrl, setDefaults, flattenDeep } from "./lib/utils.js";
import type { crawlerOptions, requestOptions } from "./types/crawler.js";

const normalizeContentType = (contentType: string) => {
    //@todo
};
const crawler = (options: crawlerOptions) => {};
// 导入依赖库

// 定义 Crawler 类
class Crawler extends EventEmitter{
    private _limiters: Cluster;

    public options: crawlerOptions;
    public globalOnlyOptions: string[];
    // private limiters: Bottleneck.Cluster;
    // private http2Connections: Record<string, any>;
    // //private log: (level: string, message: string) => void;
    // private seen: seenreq;

    constructor(options: crawlerOptions) {
        super();
        const defaultOptions: crawlerOptions = {
            autoWindowClose: true,
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
                options.headers = {...this.options.headers, ...options.headers};
            } catch (err) {
                console.warn(err);
            }
        });
    };

    private _schedule = async (options: requestOptions): Promise<void> => {
        this.emit("schedule", options);
        const limiter = this._limiters.createRateLimiter(options.rateLimit);
        limiter.submit(options.priority, async () => {
            try {
                await this._execute(options);
            } catch (err) {
                console.warn(err);
            }
        });
    }

    private _execute = async (options: Partial<requestOptions>): Promise<void> => {
        options.retries = options.retries || this.options.retries || 0;
        // delete all globalonly options
        // this.globalOnlyOptions.forEach(globalOnlyOption => {
        //     delete options[globalOnlyOption];
        // });
        // logger.debug(`${options.method} ${options.uri}`);
        if (!options.headers) {
            options.headers = {};
        }
        if (options.forceUTF8) {
            options.headers["Accept-Charset"] = "utf-8";
            options.encoding = null;
        }
        if (options.json) {
            options.encoding = null;
        }
        if (options.userAgent) {
            if (this.options.rotateUA && Array.isArray(options.userAgent)) {
                // If "rotateUA" is true, rotate User-Agent
                options.headers["User-Agent"] = options.userAgent[0];
                options.userAgent.push(options.userAgent.shift());
            } else {
                options.headers["User-Agent"] = options.userAgent;
            }
        }
        if (options.referer) {
            options.headers["Referer"] = options.referer;
        }
        if (options.proxies && options.proxies.length) {
            options.proxy = options.proxies[0];
        }
    };

    private get queueSize(): number {
        return 0;
    }

}

export default Crawler;
