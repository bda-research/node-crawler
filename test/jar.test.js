/*jshint expr:true */
'use strict';

import Crawler from '../dist/index.js';
import { CookieJar } from 'tough-cookie';
import { expect } from 'chai';

// settings for nock to mock http server
import nock from 'nock';

describe('Jar Options', function () {

    before(function () {
        nock.cleanAll();
        nock('http://test.crawler.com/').get('/setCookie').reply(function () {
            let response = [
                200,
                'ok',
                { 'Set-Cookie': `ping=pong; Domain=.crawler.com; Expires=${new Date(Date.now() + 86400000).toUTCString()}; Path=/` }
            ];
            return response;
        }).persist();
        nock('http://test.crawler.com/').get('/getCookie').reply(200, function () {
            return this.req.headers.cookie;
        }).persist();
    });

    after(function () {
        nock.cleanAll();
    });

    let jar = new CookieJar();
    jar.setCookieSync('foo=bar', 'http://test.crawler.com');

    let crawler = new Crawler({
        jQuery: false,
        jar: jar
    });

    it('should send with cookie when setting jar options', function (finishTest) {
        crawler.queue({
            uri: 'http://test.crawler.com/getCookie',
            callback: (error, response, done) => {
                expect(error).to.be.null;
                expect(response.body).to.equal(jar.getCookieStringSync('http://test.crawler.com'));
                done();
                finishTest();
            }
        });
    });

    it('should set cookie when response set-cookie headers exist', function (finishTest) {
        crawler.queue({
            uri: 'http://test.crawler.com/setCookie',
            callback: (error, response, done) => {
                expect(error).to.be.null;
                expect(jar.getCookieStringSync('http://test.crawler.com').indexOf('ping=pong') > -1).to.be.true;
                done();
                finishTest();
            }
        });
    });
});