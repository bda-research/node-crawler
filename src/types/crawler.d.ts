declare global {
    var mainModule: string;
}

type globalOptions = {
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
    skipDuplicates: boolean;
    homogeneous: boolean;
    rotateUA: boolean;
};

type crawlerOptions = globalOptions & {
    headers?: Record<string, unknown>;
    forceUTF8: boolean;
    gzip?: boolean;
    incomingEncoding?: string | null;
    jQuery?: boolean;
    method?: string;
    priority: number;
    retries: number;
    retryTimeout: number;
    timeout: number;
    referer?: boolean;
    skipEventRequest?: boolean;
    html?: boolean;
    proxies?: string[];
    proxy?: string;
    http2?: boolean;
    debug?: boolean;
    logger?: any;
    seenreq?: any;
};

type deprecatedOptions = {};

type requestOptions = crawlerOptions & {
    preRequest: (options: requestOptions, done: (error: Error | null, options: requestOptions) => void) => void;
    release: () => void;
    callback?: (error: any, response: unknown, done: unknown) => void;
    uri: string | function;
    userAgent: string;
    headers: Record<string, unknown>;
    encoding: string | null;
    json: boolean;
};

export { crawlerOptions, requestOptions };
