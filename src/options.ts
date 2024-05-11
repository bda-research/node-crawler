import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import http2Wrapper from "http2-wrapper";
import { cleanObject, getType, isValidUrl } from "./lib/utils.js";

export const getCharset = (headers: Record<string, string>): null | string => {
    let charset = null;
    const contentType = headers["content-type"];
    if (contentType) {
        const match = contentType.match(/charset=['"]?([\w.-]+)/i);
        if (match) {
            charset = match[1].trim().toLowerCase();
        }
    }
    return charset;
};

export const getValidOptions = (options: unknown): Object => {
    const type = getType(options);
    if (type === "string") {
        try {
            if (isValidUrl(options as string)) return { url: options };
            options = JSON.parse(options as string);
            return options as Object;
        } catch (e) {
            throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
        }
    } else if (type === "object") {
        const prototype = Object.getPrototypeOf(options);
        if (prototype === Object.prototype || prototype === null) return options as Object;
    }
    throw new TypeError(`Invalid options: ${JSON.stringify(options)}`);
};

export const alignOptions = (options: any): any => {
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
    ];
    const deprecatedOptions = ["uri", "qs", "strictSSL", "gzip", "jar", "jsonReviver", "jsonReplacer", "json", "skipEventRequest"].concat(
        crawlerOnlyOptions
    );
    const gotOptions = {
        ...options,
        url: options.url ?? options.uri,
        searchParams: options.searchParams ?? options.qs,
        decompress: options.decompress ?? options.gzip,
        parseJson: options.parseJson ?? options.jsonReviver,
        stringifyJson: options.stringifyJson ?? options.jsonReplacer,
        timeout: { request: options.timeout },
    };

    options.rejectUnauthorized = options.rejectUnauthorized ?? options.strictSSL;
    if (options.rejectUnauthorized !== undefined) {
        if (gotOptions.https === undefined) {
            gotOptions.https = { rejectUnauthorized: options.rejectUnauthorized }
        }
        else {
            gotOptions.https.rejectUnauthorized = options.rejectUnauthorized;
        }
    }

    const defaultagent = {
        https: new HttpsProxyAgent({ proxy: options["proxy"] }),
        http: new HttpProxyAgent({ proxy: options["proxy"] }),
    };

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
        gotOptions.agent = { http2: http2Agent }
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
            const domain = gotOptions.url.match(/^(\w+):\/\/([^\/]+)/);
            if (domain) gotOptions.headers.referer = domain[0];
        }
    }

    gotOptions.retry = { limit: 0 };
    return gotOptions;
};
