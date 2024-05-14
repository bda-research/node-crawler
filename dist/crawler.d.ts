/// <reference types="node" />
import { EventEmitter } from "events";
import type { CrawlerOptions, RequestConfig, CrawlerResponse } from "./types/crawler.js";
declare class Crawler extends EventEmitter {
    private _limiters;
    private _UAIndex;
    private _proxyIndex;
    options: CrawlerOptions;
    globalOnlyOptions: string[];
    seen: any;
    constructor(options?: CrawlerOptions);
    private _detectHtmlOnHeaders;
    private _schedule;
    private _execute;
    private _handler;
    get queueSize(): number;
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
    setLimiter(rateLimiterId: number, property: string, value: unknown): void;
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
    send: (options: RequestConfig) => Promise<CrawlerResponse>;
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.send()` instead.
     * @see Crawler.send
     */
    direct: (options: RequestConfig) => Promise<CrawlerResponse>;
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
    add: (options: RequestConfig) => void;
    /**
     * @deprecated
     * @description Old interface version. It is recommended to use `Crawler.add()` instead.
     * @see Crawler.add
     */
    queue: (options: RequestConfig) => void;
}
export default Crawler;
//# sourceMappingURL=crawler.d.ts.map