import cheerio from "cheerio";
import dayjs from "dayjs";
import fs from "fs";
import got from "got";
import * as http2 from "http2";
import path from "path";
import util from "util";
import logger from "./logger.js";
import { RateLimiter, Cluster } from "./rateLimiter/index.js";
import { getType } from "./lib/utils.js";
import type { crawlerOptions, requestOptions } from "./types/crawler.js";

const normalizeContentType = (contentType: string) => {
    //@todo
};
const crawler = (options: crawlerOptions) => {};
// 导入依赖库

// 定义 Crawler 类
class Crawler {
    private _limiters: Cluster;

    public options: crawlerOptions;
    public globalOnlyOptions: string[];
    // private limiters: Bottleneck.Cluster;
    // private http2Connections: Record<string, any>;
    // //private log: (level: string, message: string) => void;
    // private seen: seenreq;

    constructor(options: crawlerOptions) {
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
    private _isValidOptions = (options: unknown): boolean => {
        const type = getType(options);
        if (type === "string") {
            try {
                options = JSON.parse(options as string);
                return true;
            } catch (e) {
                return false;
            }
        } else if (type === "object") {
            const prototype = Object.getPrototypeOf(options);
            return prototype === Object.prototype || prototype === null;
        }
        return false;
    };

    private _execute = async (options: Partial<requestOptions>): Promise<void> => {
        if (!this._isValidOptions(options)) {
            logger.warn("Invalid options: ", JSON.stringify(options));
        }
        options.retries = options.retries || this.options.retries || 0;
        // delete all globalonly options
        // this.globalOnlyOptions.forEach(globalOnlyOption => {
        //     delete options[globalOnlyOption];
        // });
        logger.debug(`${options.method} ${options.uri}`);
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

    // 添加 queueSize 属性
    private get queueSize(): number {
        // 计算队列大小的逻辑
        return 0; // 这里需要根据实际情况返回队列大小
    }

    // 添加 _clearHttp2Session 方法
    private _clearHttp2Session(): void {
        // 清除 HTTP/2 会话的逻辑
    }

    // 添加其他需要的方法和属性
}

// 导出 Crawler 类
export default Crawler;
