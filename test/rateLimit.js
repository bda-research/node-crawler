import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    t.context.c = new Crawler({
        // silence: true,
        retries: 0,
        rateLimit: 500,
        callback: (err, res, done) => {
            t.is(err, null);
            t.is(res.statusCode, 200);
            done();
        }
    });
    t.context.c.on('request', () => t.context.tsArrs.push(Date.now()));
    t.context.tsArrs = [];
});
test.afterEach(t => {
    nock.cleanAll();
    t.context.c = {};
    t.context.tsArrs = [];
});

testCb(test, "Interval of two requests should be no less than 500ms", async t => {
    nock('http://nockHost').get(url => url.includes('status')).times(2).delay(500).reply(200, 'Yes');
    t.context.c.add({ url: 'http://nockHost/status/200' });
    t.context.c.add({
        url: 'http://nockHost/status/200',
        callback: (err, res, done) => {
            t.is(err, null);
            t.is(res.statusCode, 200);
            done();
            t.is(t.context.tsArrs.length, 2);
            t.true(t.context.tsArrs[1] - t.context.tsArrs[0] >= 500);
            done();
        }
    });
    t.context.c.on("drain", t.end);
});

testCb(test, "request speed should abide by rateLimit", async t => {
    nock('http://nockHost').get(url => url.includes('status')).times(5).reply(200, 'Yes');
    for (let i = 0; i < 5; i++) {
        t.context.c.add('http://nockHost/status/200');
    }
    t.context.c.on("drain", () => {
        t.is(t.context.tsArrs.length, 5);
        for (let i = 1; i < 5; i++) {
            const interval = t.context.tsArrs[i] - t.context.tsArrs[i - 1];
            t.true(Math.abs(interval - 500) < 30);
        }
        t.end();
    });
});

testCb(test, "should be able to change rateLimit", async t => {
    nock('http://nockHost').get(url => url.includes('status')).times(5).reply(200, 'Yes');
    t.context.c.setLimiter(0, 'rateLimit', 300);
    for (let i = 0; i < 5; i++) {
        t.context.c.add('http://nockHost/status/200');
    }
    t.context.c.on("drain", () => {
        t.is(t.context.tsArrs.length, 5);
        for (let i = 1; i < 5; i++) {
            const interval = t.context.tsArrs[i] - t.context.tsArrs[i - 1];
            t.true(Math.abs(interval - 300) < 30);
        }
        t.end();
    });
});
