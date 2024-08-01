import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.before(t => {
    nock.cleanAll();
    nock("http://test.crawler.com").get("/delay/1").delay(1000).reply(200, "ok").persist();
    nock("http://test.crawler.com").get("/status/400").reply(400, "Bad Request").persist();
    nock("http://test.crawler.com").get("/status/401").reply(401, "Unauthorized").persist();
    nock("http://test.crawler.com").get("/status/403").reply(403, "Forbidden").persist();
    nock("http://test.crawler.com").get("/status/404").reply(404, "Not Found").persist();
    nock("http://test.crawler.com").get("/status/500").reply(500, "Internal Error").persist();
    nock("http://test.crawler.com").get("/status/204").reply(204, "").persist();
});
test.beforeEach(t => {
    t.context.crawler = new Crawler({
        // silence: true,
        timeout: 500,
        retryInterval: 500,
        retries: 2,
        jQuery: false,
    });
});
test.afterEach(t => {
    t.context.crawler = null;
});

testCb(test, "should retry after timeout", async t => {
    let options = {
        url: "http://test.crawler.com/delay/1",
        callback: (error, response, done) => {
            t.truthy(error);
            t.is(response.options.retries, 0);
            t.end();
        },
    };
    t.context.crawler.add(options);
    t.is(options.retries, 2);
});

testCb(test, "should return a timeout error after ~2sec", async t => {
    t.context.crawler.add({
        url: "http://test.crawler.com/delay/1",
        callback: (error, response, done) => {
            t.truthy(error);
            t.true(error.code === "ETIMEDOUT" || error.code === "ESOCKETTIMEDOUT");
            t.end();
        },
    });
});

testCb(test, "should not failed on empty response", async t => {
    t.context.crawler.add({
        url: "http://test.crawler.com/status/204",
        callback: (error, response, done) => {
            t.falsy(error);
            t.is(response.statusCode, 204);
            t.end();
        },
    });
});

testCb(test, "should not failed on a malformed html if jQuery is false", async t => {
    t.context.crawler.add({
        html: "<html><p>hello <div>dude</p></html>",
        callback: (error, response, done) => {
            t.falsy(error);
            t.truthy(response);
            t.end();
        },
    });
});
