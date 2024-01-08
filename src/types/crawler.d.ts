declare global {
    var mainModule: string;
}
interface crawlerOptions {
    autoWindowClose: boolean;
    forceUTF8: boolean;
    gzip: boolean;
    incomingEncoding: string | null;
    jQuery: boolean;
    maxConnections: number;
    method: string;
    priority: number;
    priorityCount: number;
    rateLimit: number;
    referer: boolean;
    retries: number;
    retryTimeout: number;
    timeout: number;
    skipDuplicates: boolean;
    rotateUA: boolean;
    homogeneous: boolean;
    proxies: string[];
    proxy: string;
    http2: boolean;
    debug?: boolean;
    logger?: any;
    seenreq?: any;
}
interface requestOptions extends crawlerOptions {
    uri: string;
    userAgent: string;
    headers: Record<string, string | boolean>;
    encoding: string | null;
    json: boolean;
}

export { crawlerOptions, requestOptions };
