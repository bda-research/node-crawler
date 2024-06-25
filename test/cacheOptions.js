import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.beforeEach(t => {
    t.context.scope = nock("http://target.com");
});
test.afterEach(t => {
    t.context.c = {};
});

testCbSync(test, "Should't skip one single url if duplicates are active.", async t => {
    t.context.scope.get("/").reply(200);
    t.context.c = new Crawler({
        // silence: true,
        skipDuplicates: true,
        callback: (error, result, done) => {
            t.is(error, null);
            t.is(result.statusCode, 200);
            t.true(t.context.scope.isDone());
            t.end();
        },
    });
    t.context.c.add("http://target.com");
});

testCbSync(test, "Should notify the callback when an error occurs and 'retries' is disabled.", async t => {
    t.context.scope.get("/").replyWithError("Bad request.");
    t.context.c = new Crawler({
        // silence: true,
        jQuery: false,
        skipDuplicates: true,
        retries: 0,
        callback: (error, result, done) => {
            t.truthy(error);
            t.true(t.context.scope.isDone());
            t.end();
        },
    });
    t.context.c.add("http://target.com");
});

testCbSync(test, "Should retry and notify the callback when an error occurs and 'retries' is enabled.", async t => {
    t.context.scope.get("/").replyWithError("Bad request.").persist();
    t.context.c = new Crawler({
        jQuery: false,
        skipDuplicates: true,
        retries: 1,
        retryInterval: 10,
        callback: (error, result, done) => {
            t.truthy(error);
            t.true(t.context.scope.isDone());
            t.context.scope.persist(false);
            t.end();
        },
    });
    t.context.c.add("http://target.com");
});

testCbSync(test, "Should skip previously crawled urls when 'skipDuplicates' is active.", async t => {
    t.context.scope.get("/").reply(200).persist();
    t.plan(3);
    t.context.c = new Crawler({
        jQuery: false,
        skipDuplicates: true,
        callback: (error, result, done) => {
            t.is(error, null);
            t.is(result.statusCode, 200);
            t.true(t.context.scope.isDone());
            t.context.c.add("http://target.com");
            done();
        },
    });
    t.context.c.add("http://target.com");
    t.context.c.on("drain", () => {
        t.end();
    });
});
