import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";
import { CookieJar } from "tough-cookie";

test.before(t => {
    nock.cleanAll();
    nock("http://test.crawler.com/").get("/setCookie").reply(function () {
        let response = [200, "ok",
            {
                "Set-Cookie": `ping=pong; Domain=.crawler.com; Expires=${new Date(
                    Date.now() + 86400000
                ).toUTCString()}; Path=/`,
            },
        ];
        return response;
    }).persist();
    nock("http://test.crawler.com/").get("/getCookie").reply(200, function () {
        return this.req.headers.cookie;
    }).persist();
    const jar = new CookieJar();
    jar.setCookieSync("foo=bar", "http://test.crawler.com");
    t.context.jar = jar;
    t.context.crawler = new Crawler({
        silence: true,
        jQuery: false,
        jar: t.context.jar,
    });
});

testCbSync(test, "should send with cookie when setting jar options", async t => {
    t.context.crawler.add({
        url: "http://test.crawler.com/getCookie",
        callback: (error, response, done) => {
            t.is(error, null);
            t.is(response.body, t.context.jar.getCookieStringSync("http://test.crawler.com"));
            done();
            t.end();
        }
    });
});

testCbSync(test, "should set cookie when response set-cookie headers exist", async t => {
    t.context.crawler.add({
        url: "http://test.crawler.com/setCookie",
        callback: (error, response, done) => {
            t.is(error, null);
            t.true(t.context.jar.getCookieStringSync("http://test.crawler.com").includes("ping=pong"));
            done();
            t.end();
        }
    });
});
