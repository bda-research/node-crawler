import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import { cleanObject } from "./lib/utils.js";

export const alignOptions = (options: any): any => {
    const crawlerOnlyOptions = [
        "forceUTF8",
        "incomingEncoding",
        "jQuery",
        "retryTimeout",
        "timeout",
        "priority",
        "proxy",
        "retries",
        "preRequest",
    ];
    const deprecatedOptions = ["uri", "qs", "strictSSL", "gzip", "jar", "jsonReviver", "jsonReplacer"].concat(
        crawlerOnlyOptions
    );
    const defaultagent = {
        https: new HttpsProxyAgent({
            proxy: options["proxy"],
        }),
        http: new HttpProxyAgent({
            proxy: options["proxy"],
        }),
    };

    const gotOptions = {
        ...options,
        url: options.uri,
        searchParams: options.qs,
        rejectUnauthorized: options.strictSSL,
        decompress: options.gzip,
        cookieJar: options.jar,
        parseJson: options.jsonReviver,
        stringifyJson: options.jsonReplacer,
    };
    gotOptions.agent = gotOptions.agent ?? (options.proxy ? defaultagent : undefined);

    Object.keys(gotOptions).forEach(key => {
        if (deprecatedOptions.includes(key)) {
            delete gotOptions[key];
        }
    });
    cleanObject(gotOptions);
    return gotOptions;
};
