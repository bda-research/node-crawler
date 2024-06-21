import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";
import sinon from "sinon";

test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    nock("http://nockhost")
        .get(uri => uri.indexOf("status") >= 0)
        .times(20)
        .reply(200, "Yes");
    t.context.crawler = new Crawler({
        silence: true,
        maxConnections: 10,
        jQuery: false,
    });
});
test.afterEach(t => {
    t.context.crawler = null;
    t.context.cb = null;
});

testCb(test, "should run the first readme examples.", async t => {
    t.context.crawler.add({
        url: "http://github.com",
        callback: (err, res, done) => {
            t.falsy(err);
            t.is(typeof res.body, "string");
            t.end();
        },
    });
});

testCb(test, "should run the readme examples.", async t => {
    t.context.crawler = new Crawler({
        silence: true,
        maxConnections: 10,
        jQuery: false,
        callback: (err, res, done) => {
            t.falsy(err);
            done();
        },
    });
    t.context.cb = sinon.spy(t.context.crawler, "add");
    t.context.crawler.add("http://nockhost/status/200");
    t.context.crawler.add("http://nockhost/status/200");
    t.context.crawler.on("drain", () => {
        t.true(t.context.cb.calledTwice);
        t.end();
    });
});

testCb(test, "should run the with an array queue.", async t => {
    t.context.crawler.add([
        {
            url: "http://www.github.com",
            jQuery: true,
            callback: (err, res, done) => {
                t.falsy(err);
                t.truthy(res.$);
                t.is(typeof res.body, "string");
                done();
            },
        },
    ]);
    t.context.crawler.on("drain", () => {
        t.end();
    });
});
