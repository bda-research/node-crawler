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
     * @example 1000 means around 1000 milliseconds delay.
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
     * @description If true, the crawler will rotate the user agent for each request. The "userAgent" option must be an array if this option is true.
     */
    rotateUA: boolean;
};

type requestOptions = {
    forceUTF8?: boolean;
    jQuery?: boolean;
    incomingEncoding?: string | null;
    retries?: number;
    retryTimeout?: number;
    timeout?: number;
    priority?: number;
    seenreq?: any;

    uri?: string | function;
    url?: string | function;
    body?: string | Record<string, unknown>;
    userAgent?: string;
    headers?: Record<string, unknown>;
    encoding?: string | null;
    json?: boolean;
    headers?: Record<string, unknown>;
    gzip?: boolean;
    method?: string;
    referer?: boolean | string;
    skipEventRequest?: boolean;
    html?: boolean;
    proxies?: string[];
    proxy?: string;
    http2?: boolean;
    debug?: boolean;
    logger?: any;
    preRequest?: (options: requestOptions, done: (error: Error | null, options: requestOptions) => void) => void;
    release?: () => void;
    callback?: (error: any, response: unknown, done: unknown) => void;
};

type crawlerOptions = globalOnlyOptions & requestOptions;

export { crawlerOptions, requestOptions };
