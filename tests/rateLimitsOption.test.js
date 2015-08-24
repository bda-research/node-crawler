'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';

describe('Limits', function() {
    describe('rate limits', function() {
        var startTime, c, cb;
        beforeEach(function() {
            startTime = new Date().getTime();
            c = new Crawler({
                rateLimits: 5000
            });
        });
        it('should delay 5000 milliseconds between each requests', function(done) {
            this.timeout(20000);
            var count = 0;
            cb = function() {
                var endTime = new Date().getTime(),
                    deltaTime = endTime - startTime;
                count++;
                //console.log(count, deltaTime);
                if (count === 1) {
                    expect(deltaTime).above(5000);
                    expect(deltaTime).below(10000);
                } else if (count === 2) {
                    expect(deltaTime).above(10000);
                    expect(deltaTime).below(15000);
                } else if (count === 3) {
                    expect(deltaTime).above(15000);
                    expect(deltaTime).below(20000);
                    done();
                }
            };
            c.queue([{
                uri: 'http://' + httpbinHost + '/ip',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/user-agent',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/headers',
                callback: cb
            }]);
        });
    });
});
