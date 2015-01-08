'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var sinon = require('sinon');
var url = require('url');
var c, spy;

describe('Simple test', function() {
    afterEach(function() {
        c = {};
        spy = {};
    });
    it('should run the first readme examples', function(done) {
        c = new Crawler({
            maxConnections: 10,
            // retries: 0,
            retryTimeout: 1000,
            debug: true,
            onDrain: function() {
                done();
            },
            callback: function(error, result) {

                expect(typeof result.body).to.equal('string');
            }
        });
        c.queue({
          uri: 'http://baidu.com',
          headers: function() {
            return {Cookie: "a=1"};
          },
          proxy: function() {
            return "http://221.219.21.179:8118";
          }
        });
    });
});