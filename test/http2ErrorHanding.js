import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import Crawler from "../dist/index.js";

test.before(t => {
    t.context.crawler = new Crawler({
        // silence: true,
        timeout: 1000,
        retryInterval: 0,
        retries: 2,
        jQuery: false,
        http2: true,
    });
});

testCbSync(test, "http2: should retry after timeout.", async t => {
    const options = {
        url: "https://nghttp2.org/httpbin/delay/4",
        callback: (error, response, done) => {
            t.truthy(error);
            t.is(response.options.retries, 0);
            done();
            t.end();
        },
    };
    t.context.crawler.add(options);
    t.is(options.retries, 2);
});

testCbSync(test, "http2: should return a timeout error after ~3sec.", async t => {
    t.context.crawler.add({
        url: "https://nghttp2.org/httpbin/delay/4",
        callback: (error, response, done) => {
            t.truthy(error);
            t.true(error.code === "ETIMEDOUT" || error.code === "ESOCKETTIMEDOUT");
            done();
            t.end();
        },
    });
});
