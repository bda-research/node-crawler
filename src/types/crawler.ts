declare global {
    var mainModule: string;
}

type globalOnlyOptions = {
    maxConnections: number;
    /**
     * Global option.
     * @default 10
     * @description The number of levels of priority. Can be only assigned at the beginning.
     */
    priorityLevels: number;
    /**
     * Global option.
     * @default 1000
     * @description The default priority of the tasks. Can be only assigned at the beginning.
     * @example 1000 means 1000 milliseconds delay between after the first request.
     */
    rateLimit: number;
    /**
     * Global option.
     * @default false
     * @description If true, the crawler will skip duplicate tasks.
     * @example If the task is already in the queue, the crawler will not add it again.
     */
    skipDuplicates: boolean;
    /**
     * Global option.
     * @default false
     * @description If true, the crawler will dynamically reallocate the tasks within the queue blocked due to header blocking to other queues.
     */
    homogeneous: boolean;
    /**
     * Global option.
     * @default false
     * @description If true, the crawler will rotate the user agent for each request. The "userAgent" option must be an array if activated.
     */
    rotateUA: boolean;
};

type requestOptions = {
    forceUTF8?: boolean;
    /**
     * crawlerOption
     * @default false
     * @description If true, the crawler will use the cheerio library to parse the HTML content.
     * @see cheerio.load()
     * @example If inject successfully, the response object will have "$" property, which is a function to use jQuery.
     */
    jQuery?: boolean;
    /**
     * @deprecated
     * @description Please use "encoding" instead.
     */
    incomingEncoding?: string | null;
    /**
     * @default "utf8"
     * @description The encoding of the response body.
     */
    encoding?: string | null;
    /**
     * @default 0
     * @description rateLimiter ID
     */
    rateLimiterId?: number;
    retries?: number;
    retryTimeout?: number;
    timeout?: number;
    priority?: number;
    seenreq?: any;

    method?: string;
    skipEventRequest?: boolean;
    html?: boolean;
    proxies?: string[];
    proxy?: string;
    http2?: boolean;
    body?: string | Record<string, unknown>;
    userAgent?: string | string[];
    headers?: Record<string, unknown>;

    agent?: any;
    /**
     * @deprecated Please use "url" instead.
     */
    uri?: string | Function;
    url?: string | Function;
    /**
     * @deprecated Please use "searchParams" instead.
     */
    qs?: Record<string, unknown>;
    /**
     * @description The query string of the URL.
     */
    searchParams?: Record<string, unknown>;
    /**
     * @deprecated Please use "rejectUnauthorized" instead.
     */
    strictSSL?: boolean;
    /**
     * @description If false, the crawler will ignore SSL certificate errors.
     * @default true
     */
    rejectUnauthorized?: boolean;
    json?: boolean;
    /**
     * @deprecated Please use "decompress" instead.
     */
    gzip?: boolean;
    decompress?: boolean;
    /**
     * @deprecated Please use "cookieJar" instead.
     */
    jar?: Object;
    cookieJar?: Object;
    /**
     * @deprecated Please use "parseJson" instead.
     */
    jsonReviver?: Function;
    parseJson?: Function;
    /**
     * @deprecated Please use "stringifyJson" instead.
     */
    jsonReplacer?: Function;
    stringifyJson?: Function;

    preRequest?: (options: requestOptions, done?: (error?: Error | null) => void) => void;
    release?: () => void;
    callback?: (error: any, response: unknown, done: unknown) => void;
};

type crawlerOptions = Partial<globalOnlyOptions> & requestOptions;

export { crawlerOptions, requestOptions };
