import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    nock("http://nockHost")
        .get(url => url.indexOf("status") >= 0)
        .times(5)
        .reply(200, "Yes");
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        rateLimit: 500,
        retries: 0,
        callback: (err, result, done) => {
            t.is(err, null);
            t.is(result.statusCode, 200);
            done();
        },
    });
    t.context.tsArrs = [];
    t.context.crawler.on("request", () => {
        t.context.tsArrs.push(Date.now());
    });
});
test.afterEach(t => {
    t.context.crawler = null;
    t.context.tsArrs = [];
});

testCbSync(test, "One limiter, tasks should execute one by one", async t => {
    for (let i = 0; i < 5; i++) {
        t.context.crawler.add({ url: "http://nockHost/status/200" });
    }
    t.context.crawler.on("drain", () => {
        t.is(t.context.tsArrs.length, 5);
        // setTimeout in nodejs is delayed
        // 4 rateLimit +- 50ms = 4 * 500 +- 50
        t.true(t.context.tsArrs[4] - t.context.tsArrs[0] >= 1950);
        t.true(t.context.tsArrs[4] - t.context.tsArrs[0] <= 2050);
        t.end();
    });
});

testCbSync(test, "Multiple limiters, tasks should execute in parallel", async t => {
    for (let i = 0; i < 5; i++) {
        t.context.crawler.add({ url: "http://nockHost/status/200", rateLimiterId: i });
    }
    t.context.crawler.on("drain", () => {
        t.is(t.context.tsArrs.length, 5);
        // setTimeout in nodejs is delayed
        // request sent almost at same time
        t.true(t.context.tsArrs[4] - t.context.tsArrs[0] <= 50);
        t.end();
    });
});

testCbSync(test, "Multiple limiters are mutual independent", async t => {
    for (let i = 0; i < 5; i++) {
        const limiter = i === 4 ? "second" : "default";
        t.context.crawler.add({ url: "http://nockHost/status/200", rateLimiterId: limiter });
    }
    t.context.crawler.on("drain", () => {
        t.is(t.context.tsArrs.length, 5);
        // setTimeout in nodejs is delayed
        // 3 rateLimit +- 50ms = 3 * 500 +- 50
        t.true(t.context.tsArrs[4] - t.context.tsArrs[0] >= 1450);
        t.true(t.context.tsArrs[4] - t.context.tsArrs[0] <= 1550);
        t.end();
    });
});

testCbSync(test, "should modify maxConnections when rateLimit is set", async t => {
    nock.cleanAll();
    nock("http://nockHost").get(url => url.indexOf("status") >= 0).times(1).reply(200, "Yes");
    t.context.crawler.add({
        url: "http://nockHost/status/200",
        callback: (err, result, done) => {
            t.is(err, null);
            t.is(result.statusCode, 200);
            done();
        },
    });
    t.context.crawler.on("drain", () => {
        t.is(t.context.crawler.options.maxConnections, 1);
        t.end();
    });
});
