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
});

testCb(test, "Should do preRequest before request when preRequest defined in crawler options.", async t => {
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        preRequest: (options, done) => {
            setTimeout(() => {
                t.context.cb("preRequest");
                done();
            }, 50);
        },
    });
    t.context.crawler.add({
        url: "http://test.crawler.com/",
        callback: (error, response, done) => {
            t.is(error, null);
            t.is(t.context.cb.getCalls().length, 1);
            t.is(t.context.cb.getCalls()[0].args[0], "preRequest");
            done();
            t.end();
        },
    });
});

testCb(test, "Should do preRequest before request when preRequest defined in add options.", async t => {
    t.context.crawler = new Crawler({
        // silence: true, 
        jQuery: false
    });
    t.context.crawler.add({
        url: "http://test.crawler.com/",
        preRequest: (options, done) => {
            setTimeout(() => {
                t.context.cb("preRequest");
                done();
            }, 50);
        },
        callback: (error, response, done) => {
            t.is(error, null);
            t.is(t.context.cb.getCalls().length, 1);
            t.is(t.context.cb.getCalls()[0].args[0], "preRequest");
            done();
            t.end();
        },
    });
});

testCb(test, "preRequest should be executed the same times as request.", async t => {
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        rateLimit: 50,
        preRequest: (options, done) => {
            t.context.cb("preRequest");
            done();
        },
        callback: (error, response, done) => {
            t.is(error, null);
            t.context.cb("callback");
            done();
        },
    });
    const seq = [];
    for (let i = 0; i < 5; i++) {
        t.context.crawler.add("http://test.crawler.com/");
        seq.push("preRequest");
        seq.push("callback");
    }
    t.context.crawler.add({
        url: "http://test.crawler.com/",
        preRequest: (options, done) => done(),
        callback: (error, response, done) => {
            t.is(error, null);
            t.deepEqual(
                t.context.cb.getCalls().map(call => call.args[0]),
                seq
            );
            done();
            t.end();
        },
    });
});

testCb(test, "when preRequest fail, should retry two times by default.", async t => {
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        rateLimit: 20,
        retryInterval: 0,
        preRequest: (options, done) => {
            t.context.cb("preRequest");
            done(new Error("error"));
        },
        callback: (error, response, done) => {
            t.truthy(error instanceof Error);
            t.is(t.context.cb.getCalls().length, 3);
            t.deepEqual(
                t.context.cb.getCalls().map(call => call.args[0]),
                ["preRequest", "preRequest", "preRequest"]
            );
            done();
            t.end();
        },
    });
    t.context.crawler.add("http://test.crawler.com/");
});
