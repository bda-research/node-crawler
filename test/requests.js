import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

const origin = 'http://www.whatever.com';
const path = '/get';
const headerPath = '/header';
test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    t.context.crawler = new Crawler({
        silence: true,
        retries: 0,
        isJson: true,
        callback: (err, res, done) => {
            t.is(err, null);
            t.is(res.statusCode, 200);
            done();
        }
    });
    t.context.scope = nock(origin).get(path).reply(200).persist();
    nock(origin).get(headerPath).reply(function () {
        return [200, this.req.headers, { 'Content-Type': 'application/json' }];
    });
});
test.afterEach(t => {
    t.context.scope.persist(false);
    t.context.crawler = null;
});

testCb(test, "should crawl one request", async t => {
    t.context.crawler.add({
        url: `${origin}${path}`, callback: (error, res, done) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            done();
            t.end();
        }
    });
});

testCb(test, "should crawl two request request and emit the drain event.", async t => {
    const callback = function (error, res, next) {
        t.is(error, null);
        t.is(res.statusCode, 200);
        next();
    };

    t.context.crawler.on('drain', t.end);

    t.context.crawler.add({
        url: `${origin}${path}`,
        callback: callback
    });

    t.context.crawler.add({
        url: `${origin}${path}`,
        callback: callback
    });
});

testCbSync(test, "should use the provided user-agent", async t => {
    const userAgent = 'test/1.2';
    t.context.crawler.add({
        url: `${origin}${path}`,
        headers: { "user-agent": userAgent },
        callback: (error, res, done) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            t.is(res.options.headers['user-agent'], userAgent);
            done();
            t.end();
        }
    });
});

testCbSync(test, "should replace the global default user-agent", async t => {
    t.context.crawler = new Crawler({
        silence: true,
        isJson: true,
        headers: { "user-agent": "test/1.2" },
        callback: (err, res, done) => {
            t.is(err, null);
            t.is(res.body['user-agent'], "foo/bar");
            done();
            t.end();
        }
    });
    t.context.crawler.add({
        url: `${origin}${headerPath}`,
        headers: { "user-agent": "foo/bar" }
    });
});

testCbSync(test, "should spoof the referrer", async t => {
    const referer = 'http://spoofed.com';
    t.context.crawler.add({
        url: `${origin}${path}`,
        referer: referer,
        callback: (error, res, done) => {
            t.is(error, null);
            t.is(res.options.headers.referer, referer);
            done();
            t.end();
        }
    });
});
