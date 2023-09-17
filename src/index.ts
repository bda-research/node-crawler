import cheerio from "cheerio";
import dayjs from "dayjs";
import fs from "fs";
import got from "got";
import * as http2 from "http2";
import path from "path";
import util from "util";
import logger from "./logger.js";

import Bottleneck from "bottleneck";
import seenreq from "seenreq";

import type { crawlerOptions } from "./types/index.d.ts";

const normalizeContentType = (contentType: string) => {
    //@todo
};
const crawler = (options: crawlerOptions) => {};
// 导入依赖库
const getType = (obj: any): string => Object.prototype.toString.call(obj).slice(8, -1);


// 定义 Crawler 类
class Crawler {
    private options: crawlerOptions;
    private globalOnlyOptions: string[];
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
        this.options = { ...defaultOptions, ...options };

        this.globalOnlyOptions = ["skipDuplicates", "rotateUA"];

        // this.limiters = new Bottleneck.Cluster(
        //     this.options.maxConnections,
        //     this.options.rateLimit,
        //     this.options.priorityRange,
        //     this.options.priority,
        //     this.options.homogeneous
        // );

        // this.http2Connections = {};

        const level = this.options.debug ? "debug" : "info";

        // this.seen = new seenreq(this.options.seenreq);
        // this.seen
        //     .initialize()
        //     .then(() => this.log("debug", "seenreq is initialized."))
        //     .catch(e => this.log("error", e));

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
    public run = (options: crawlerOptions): void => {
        isPlainObject(options);
    };
    // 添加 emit 方法
    private emit(event: string): void {
        // 实现事件触发逻辑
    }

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
