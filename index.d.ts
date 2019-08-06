declare module 'crawler' {
  import { IncomingMessage } from 'http';
  import request from 'request';
  import events from 'events';

  class Crawler extends events.EventEmitter {
    constructor(options: CreateCrawlerOptions);
    queueSize: number;
    on(channel: 'schedule', listener: (options: CrawlerRequestOptions) => void): this;
    on(channel: 'limiterChange', listener: (options: CrawlerRequestOptions, limiter: string) => void): this;
    on(channel: 'request', listener: (options: CrawlerRequestOptions) => void): this;
    on(channel: 'drain', listener: () => void): this;
    queue(uri: string): void;
    queue(uri: string[]): void;
    queue(options: CrawlerRequestOptions | CrawlerRequestOptions[]): void;
    direct(options: CrawlerRequestOptions & {
      callback: (error: Error, response: CrawlerRequestResponse) => void;
    }): void;
    setLimiterProperty(limiter: string, property?: string, value?: any): void;
  }

  export interface CrawlerRequestOptions extends request.CoreOptions {
    uri?: string;
    html?: string;
    proxy?: any;
    proxies?: any[];
    limiter?: string;
    encoding?: string;
    priority?: number;
    jQuery?: boolean | string | CheerioOptionsInterface | any;
    preRequest?: (options: CrawlerRequestOptions, doRequest: (err: Error) => void) => void;
    callback?: (err: Error, res: CrawlerRequestResponse, done: () => void) => void;
    [x: string]: any
  }

  export interface CrawlerRequestResponse extends IncomingMessage {
    body?: Buffer | string;
    request?: request.RequestAsJSON;
    options?: CrawlerRequestOptions;
    $?: CheerioAPI
    [x: string]: any
  }

  export interface CreateCrawlerOptions {
    autoWindowClose?: boolean;
    forceUTF8?: boolean;
    gzip?: boolean;
    incomingEncoding?: string;
    jquery?: boolean | string | CheerioOptionsInterface | any;
    jQuery?: boolean | string | CheerioOptionsInterface | any;
    maxConnections?: number;
    method?: string;
    priority?: number;
    priorityRange?: number;
    rateLimit?: number;
    referer?: false | string;
    retries?: number;
    retryTimeout?: number;
    timeout?: number;
    skipDuplicates?: boolean;
    rotateUA?: boolean;
    userAgent?: string | string[];
    homogeneous?: boolean;
    debug?: boolean;
    logger?: {
      log: (level: string, ...args: any[]) => void;
    };
    seenreq?: any;
    headers?: request.Headers;
    callback?: (err: Error, res: CrawlerRequestResponse, done: () => void) => void;
    [x: string]: any;
  }

  export default Crawler;
}