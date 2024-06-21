import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import http2Wrapper from "http2-wrapper";
import { cleanObject, getType, isValidUrl } from "./lib/utils.js";
import { RequestConfig, RequestOptions } from "./types/crawler.js";

export const getCharset = (headers: Record<string, unknown>): null | string => {
    let charset = null;
    const contentType = headers["content-type"] as string;
    if (contentType) {
        const match = contentType.match(/charset=['"]?([\w.-]+)/i);
        if (match) {
            charset = match[1].trim().toLowerCase();
        }
    }
    return charset;
};

export const getValidOptions = (options: RequestConfig): RequestOptions => {
    const type = getType(options);
    if (type === "string") {
        try {
            if (isValidUrl(options as string)) return { url: options } as RequestOptions;
            options = JSON.parse(options as string);
            return options as object;
        } catch (_err) {
            throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
        }
    } else if (type === "object") {
        const prototype = Object.getPrototypeOf(options);
        if (prototype === Object.prototype || prototype === null) return options as object;
    }
    throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
};

export const alignOptions = (options: RequestOptions): any => {
    const crawlerOnlyOptions = [
        "rateLimiterId",
        "forceUTF8",
        "incomingEncoding",
        "jQuery",
        "retryInterval",
        "priority",
        "proxy",
        "retries",
        "preRequest",
        "callback",
        "release",
        "userAgents",
        "isJson",
        "referer",
        "rejectUnauthorized",
        "userParams",
        "silence",
    ];
    const deprecatedOptions = ["uri", "qs", "strictSSL", "gzip", "jar", "jsonReviver", "jsonReplacer", "skipEventRequest"].concat(
        crawlerOnlyOptions
    );
    const gotOptions = {
        ...options,
        url: options.url ?? options.uri,
        searchParams: options.searchParams ?? options.qs,
        decompress: options.decompress ?? options.gzip,
        parseJson: options.parseJson ?? options.jsonReviver,
        stringifyJson: options.stringifyJson ?? options.jsonReplacer,
        cookieJar: options.cookieJar ?? options.jar,
        timeout: { request: options.timeout },
    } as any;

    const sslConfig = options.rejectUnauthorized ?? options.strictSSL;
    if (sslConfig !== undefined) {
        if (gotOptions.https === undefined) {
            gotOptions.https = { rejectUnauthorized: sslConfig };
        }
        else {
            gotOptions.https.rejectUnauthorized = sslConfig;
        }
    }

    const defaultagent = options["proxy"] ? {
        https: new HttpsProxyAgent({ proxy: options["proxy"] }),
        http: new HttpProxyAgent({ proxy: options["proxy"] }),
    } : undefined;

    // http2 proxy
    if (options.http2 === true && options.proxy) {
        const { proxies: Http2Proxies } = http2Wrapper;
        const protocol = options.proxy.startsWith("https") ? "https" : "http";
        const http2Agent =
            protocol === "https"
                ? new Http2Proxies.Http2OverHttps({
                    proxyOptions: { url: options.proxy },
                })
                : new Http2Proxies.Http2OverHttp({
                    proxyOptions: { url: options.proxy },
                });
        gotOptions.agent = { http2: http2Agent };
    } else {
        gotOptions.agent = gotOptions.agent ?? (options.proxy ? defaultagent : undefined);
    }

    /**
     * @deprecated The support of incomingEncoding will be removed in the next major version.
     */
    if (options.encoding === undefined) options.encoding = options.incomingEncoding;
    delete options["incomingEncoding"];
    gotOptions.responseType = "buffer";
    Object.keys(gotOptions).forEach(key => {
        if (deprecatedOptions.includes(key)) {
            delete gotOptions[key];
        }
    });

    const headers = gotOptions.headers;
    cleanObject(gotOptions);
    gotOptions.headers = headers;

    if (!gotOptions.headers.referer) {
        if (options.referer) {
            gotOptions.headers.referer = options.referer;
        }
        else {
            const domain = gotOptions.url.match(/^(\w+):\/\/([^/]+)/);
            if (domain) gotOptions.headers.referer = domain[0];
        }
    }

    gotOptions.retry = { limit: 0 };
    return gotOptions;
};
