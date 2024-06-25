import test from "ava";
import { testCb, testCbSync } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";

const origin = "http://czyborra.com";
const encodingFileName = "iso8859.html";
const charsetName = "ISO-8859-1";
const path = `/charsets/${encodingFileName}`;
const url = `${origin}${path}`;
const pathWithoutCharsetHeader = `/charsets-noheader/${encodingFileName}`;
const urlWithoutCharsetHeader = `${origin}${pathWithoutCharsetHeader}`;

test.before(t => {
    nock.cleanAll();
});
test.beforeEach(t => {
    t.context.crawler = new Crawler({
        retries: 0
    });

    nock(origin).get(path).replyWithFile(200, `test/lib/${encodingFileName}`, { "Content-Type": `text/html;charset=${charsetName}` });
    nock(origin).get(pathWithoutCharsetHeader).replyWithFile(200, `test/lib/${encodingFileName}`, { "Content-Type": "text/html" });
});
test.afterEach(t => {
    t.context.crawler = null;
});

testCbSync(test, "should parse latin-1", async t => {
    t.context.crawler.add({
        url,
        callback: (error, result) => {
            t.is(error, null);
            t.is(result.charset, charsetName.toLowerCase());
            t.true(result.body.indexOf("Jörg") > 0);
            t.end();
        }
    });
});

testCbSync(test, "should return buffer if encoding = null", async t => {
    t.context.crawler.add({
        url,
        encoding: null,
        callback: (error, result) => {
            t.is(error, null);
            t.true(result.body instanceof Buffer);
            t.end();
        }
    });
});

testCbSync(test, "should parse latin-1 if encoding = ISO-8859-1", async t => {
    t.context.crawler.add({
        url,
        encoding: charsetName,
        callback: (error, result) => {
            t.is(error, null);
            t.is(result.charset, charsetName.toLowerCase());
            t.true(result.body.indexOf("Jörg") > 0);
            t.end();
        }
    });
});

testCbSync(test, "could not parse latin-1 if encoding = gb2312", async t => {
    t.context.crawler.add({
        url,
        encoding: "gb2312",
        callback: (error, result) => {
            t.is(error, null);
            t.is(result.body.indexOf("Jörg"), -1);
            t.end();
        }
    });
});

testCbSync(test, "should parse charset from header", async t => {
    t.context.crawler.add({
        url,
        callback: (error, result) => {
            t.is(error, null);
            t.is(result.charset, charsetName.toLowerCase());
            t.true(result.body.indexOf("Jörg") > 0);
            t.end();
        }
    });
});

testCbSync(test, "should parse charset from meta tag in html if header does not contain content-type key", async t => {
    t.context.crawler.add({
        url: urlWithoutCharsetHeader,
        callback: (error, result) => {
            t.is(error, null);
            t.is(result.charset, charsetName.toLowerCase());
            t.true(result.body.indexOf("Jörg") > 0);
            t.end();
        }
    });
});