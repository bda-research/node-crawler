import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";
import sinon from "sinon";

test.before(t => {
    nock.cleanAll();
    nock("http://test.crawler.com").get("/").reply(200, "ok").persist();
});
test.beforeEach(t => {
    t.context.cb = sinon.spy();
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        rateLimit: 100,
        preRequest: (options, done) => {
            t.context.cb("preRequest");
            done();
        },
        callback: (err, res, done) => {
            if (err) {
                t.context.cb("error");
            } else {
                t.context.cb("callback");
            }
            done();
        },
    });
    t.context.crawler.on("request", () => {
        t.context.cb("Event:request");
    });
});
test.afterEach(t => {
    t.context.crawler = null;
});

testCb(test, "should not trigger preRequest or callback of crawler instance", async t => {
    t.context.crawler.send({
        url: "http://test.crawler.com/",
        callback: (error, res) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            t.is(res.body, "ok");
            t.false(t.context.cb.called);
            t.end();
        },
    });
});

testCb(test, "should be sent directly regardless of current queue of crawler", async t => {
    t.context.crawler.add({
        url: "http://test.crawler.com/",
        callback: (error, res, done) => {
            t.is(error, null);
            t.context.crawler.send({
                url: "http://test.crawler.com/",
                callback: () => {
                    t.is(t.context.cb.getCalls().length, 2);
                    t.context.cb("direct");
                },
            });
            done();
        },
    });
    t.context.crawler.add("http://test.crawler.com/");
    t.context.crawler.add("http://test.crawler.com/");
    t.context.crawler.add({
        url: "http://test.crawler.com/",
        callback: (error, res, done) => {
            t.is(error, null);
            const seq = [
                "preRequest",
                "Event:request",
                "direct",
                "preRequest",
                "Event:request",
                "callback",
                "preRequest",
                "Event:request",
                "callback",
                "preRequest",
                "Event:request",
            ];
            t.deepEqual(
                t.context.cb.args.map(args => args[0]),
                seq
            );
            t.end();
        },
    });
});

testCb(test, "should not trigger Event:request by default.", async t => {
    t.context.crawler.send({
        url: "http://test.crawler.com/",
        callback: (error, res) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            t.is(res.body, "ok");
            t.false(t.context.cb.calledWith("Event:request"));
            t.end();
        },
    });
});

testCb(test, "should trigger Event:request if set.", async t => {
    t.context.crawler.send({
        url: "http://test.crawler.com/",
        skipEventRequest: false,
        callback: (error, res) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            t.is(res.body, "ok");
            t.true(t.context.cb.calledWith("Event:request"));
            t.end();
        },
    });
});
