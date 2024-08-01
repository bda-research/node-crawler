import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

const url = "http://www.whatever.com";
test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    t.context.crawler = new Crawler({
        // silence: true,
        retryInterval: 0,
        retries: 0,
        timeout: 100,
    });
});
test.afterEach(t => {
    t.context.crawler = null;
});

testCb(test, "should end as expected without callback", async t => {
    t.context.scope = nock(url).get("/get").reply(200, "<html></html>", {
        "Content-Type": "text/html",
    });
    t.context.crawler.on("drain", () => {
        t.true(t.context.scope.isDone());
        t.end();
    });
    t.context.crawler.add(`${url}/get`);
});

testCb(test, "should end as expected without callback when timedout", async t => {
    t.context.scope = nock(url).get("/delay").delayBody(500).reply(200, "<html></html>", {
        "Content-Type": "text/html",
    });
    t.context.crawler.on("drain", () => {
        t.true(t.context.scope.isDone());
        t.end();
    });
    t.context.crawler.add(`${url}/delay`);
});
