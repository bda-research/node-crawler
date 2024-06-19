import test from "ava";
import { testCb } from "./lib/avaTestCb.js";
import nock from "nock";
import Crawler from "../dist/index.js";


test.beforeEach(t => {
    t.context.scope = nock('http://target.com');
});
test.afterEach(t => {
    t.context.c = {};
});

testCb(test, "Should't skip one single url whether duplicates are active.", async t => {
    t.context.scope.get('/').reply(200);
    t.context.c = new Crawler({
        jQuery: false,
        skipDuplicates: true,
        callback: (error, result, done) => {
            t.is(error, null);
            t.is(result.statusCode, 200);
            t.true(t.context.scope.isDone());
            t.end();
        },
    });
    t.context.c.add('http://target.com');
});

// testCb(test, "Skip Duplicate active requests with error", async t => {
//     t.context.scope.get('/').replyWithError('too bad');
//     t.context.c = new Crawler({
//         jQuery: false,
//         skipDuplicates: true,
//         retries: 0,
//         callback: (error, result, done) => {
//             t.truthy(error);
//             t.true(t.context.scope.isDone());
//             t.end();
//         },
//     });
//     t.context.c.add('http://target.com');
// }