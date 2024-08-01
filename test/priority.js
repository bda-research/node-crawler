import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.before(t => {
    nock.cleanAll();
    nock('http://nockHost').get(url => url.indexOf('links') >= 0).times(4).reply(200, 'Yes');
    t.context.crawler = new Crawler({ jQuery: false, maxConnections: 1 });
});

testCb(test, "should execute requests in the correct order", async t => {
    t.context.spf = [];
    let cnt = 0;
    t.context.crawler.add([{
        url: 'http://nockHost/links/0',
        priority: 4,
        callback: (error, result, done) => {
            t.context.spf[cnt++] = 0;
            done();
        }
    }])
    t.context.crawler.add([{
        url: 'http://nockHost/links/1',
        priority: 3,
        callback: (error, result, done) => {
            t.context.spf[cnt++] = 1;
            done();
        }
    }])
    t.context.crawler.add([{
        url: 'http://nockHost/links/2',
        priority: 2,
        callback: (error, result, done) => {
            t.context.spf[cnt++] = 2;
            done();
        }
    }])
    t.context.crawler.add([{
        url: 'http://nockHost/links/3',
        priority: 1,
        callback: (error, result, done) => {
            t.context.spf[cnt++] = 3;
            done();
        }
    }])
    t.context.crawler.on("drain", () => {
        t.deepEqual(t.context.spf, [0, 3, 2, 1]);
        t.end();
    });
});
