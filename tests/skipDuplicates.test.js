'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var c, s;
var http = require('http');

describe('skip duplicates', function() {
  beforeEach(function() {
    var server = http.createServer(function (req, res) {
      res.end('<html><a href="http://github.com">a</a> <a href="http://github.com">b</a></html>');
    });

    server.listen();
    s = server.address();

    c = new Crawler({
      skipDuplicates: true
    });
  });
  it('should not queue the same link', function(done) {
    c.queue({
      uri : 'http://'+s.address+':'+s.port,
      callback: function(error, result, $) {
        $('a').each(function(i,a) {
          c.queue($(a).attr('href'));
        });
        // the link currently processing plus the one added
        // if both links are added, queueItemSize will be 3
        expect(c.queueItemSize).to.equal(2);
        done();
      }
    });
  });
});
