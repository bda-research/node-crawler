import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

test.before(t => {
    nock.cleanAll();
    nock("http://nockhost").get(url => url.indexOf("status") >= 0).times(20).reply(200, "Yes");
    t.context.calledAgents = [];
    t.context.crawler = new Crawler({
        // silence: true,
        jQuery: false,
        userAgents: [
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Googlebot/2.1 (+http://www.google.com/bot.html)",
            "test/1.0",
            "test/2.0"
        ],
        callback: (error, res, done) => {
            t.context.calledAgents.push(res.request.options.headers["user-agent"]);
            done();
        }
    });
});

testCb(test, "should rotate user agents if userAgents is set.", async t => {
    t.context.crawler.add([
        "http://nockhost/status1",
        "http://nockhost/status2",
        "http://nockhost/status3",
        "http://nockhost/status4",
        "http://nockhost/status1",
    ])
    t.context.crawler.on("drain", () => {
        t.deepEqual(t.context.calledAgents, [
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Googlebot/2.1 (+http://www.google.com/bot.html)",
            "test/1.0",
            "test/2.0",
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        ]);
        t.end();
    });
});

