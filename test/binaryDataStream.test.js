import test from 'ava';
import Crawler from '../dist/index.js';
import nock from 'nock';
import { testCb } from "./lib/avaTestCb.js";


const binaryData = Buffer.from('Hello, World!', 'utf-8');

test.beforeEach(t => {
  nock('http://example.com')
    .get('/binary-data')
    .reply(200, binaryData, {
      'Content-Type': 'application/octet-stream',
    });

  t.context.crawler = new Crawler({
    encoding: null,
    callback: (err, res, done) => {
      if (err) {
        console.error(err.stack);
        return done(err);
      }

      const buffers = [];
      res.body.on('data', chunk => buffers.push(chunk));
      res.body.on('end', () => {
        const result = Buffer.concat(buffers);
        t.is(result.toString(), 'Hello, World!', 'The binary stream should match the expected content');
        done();
      });
    },
  });
});


testCb(test, 'should correctly handle and process a binary data stream', async t => {
    t.context.crawler.send({
        url: 'http://example.com/binary-data',
        callback: (error, res) => {
            t.is(error, null);
            t.is(res.statusCode, 200);
            t.end();
        },
    });
});