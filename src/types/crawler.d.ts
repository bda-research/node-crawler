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
    http2: boolean;
    debug?: boolean;
    logger?: any;
    seenreq?: any;
}

export { crawlerOptions };
