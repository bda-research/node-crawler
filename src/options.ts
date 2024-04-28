import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

export const alignOptions = (options: any): any => {
    const deprecatedOptions = ["qs", "strictSSL", "gzip", "jar", "jsonReviver", "jsonReplacer"];
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
    gotOptions.agent = gotOptions.agent ?? defaultagent;

    Object.keys(gotOptions).forEach(key => {
        if (deprecatedOptions.includes(key)) {
            delete gotOptions[key];
        }
    });
    return gotOptions;
};
