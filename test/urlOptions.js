import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";
import sinon from "sinon";

test.before(t => {
    nock.cleanAll();
    nock('http://test.crawler.com').get('/').reply(200, 'ok').persist();
    t.context.crawler = new Crawler({ silence: true, jQuery: false });
});

testCbSync(test, "should work if url is string", t => {
    t.context.crawler.add({
        url: 'http://test.crawler.com/',
        callback: (error, response, done) => {
            t.is(error, null);
            done();
            t.end();
        }
    });
});

testCbSync(test, "should work if url is a function", t => {
    function urlFn(onUrl) {
        onUrl('http://test.crawler.com/');
    }
    t.context.crawler.add({
        url: urlFn,
        callback: (error, response, done) => {
            t.is(error, null);
            done();
            t.end();
        }
    });
});

testCbSync(test, "should skip if the url is undefined or an empty string", t => {
    const push = sinon.spy(t.context.crawler, '_schedule');
    t.context.crawler.add([undefined, null, []]);
    t.context.crawler.add({
        url: 'http://test.crawler.com/',
        callback: (error, response, done) => {
            t.true(push.calledOnce);
            done();
            t.end();
        }
    });
});