'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';

describe('Limits', function() {
    describe('rate limits', function() {
        var startTime, c, cb;
        // beforeEach(function() {
        //     c = new Crawler({
        //         rateLimits: 5000,
	// 	maxConnections:1
        //     });
        // });
        it('should delay 5000 milliseconds between each requests', function(done) {
	    c = new Crawler({
		rateLimits: 2000,
		maxConnections:1
	    });
            this.timeout(20000);
            var count = 0;
            cb = function() {
                var endTime = new Date().getTime(),
                    deltaTime = endTime - startTime;
                count++;
                //console.log(count, deltaTime);
		
		if(count === 1){
		    expect(deltaTime).above(0);
                    expect(deltaTime).below(2000);
		}
                else if (count === 2) {
                    expect(deltaTime).above(2000);
                    expect(deltaTime).below(4000);
                } else if (count === 3) {
                    expect(deltaTime).above(4000);
                    expect(deltaTime).below(6000);
		    done();
                }
            };
	    
            startTime = new Date().getTime();
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
	it('should delay certain time between requests of key', function(done) {
	    c = new Crawler({
		rateLimits: 1500,
		maxConnections:3
	    });
            this.timeout(20000);
            var count = {'a':0,'b':0,'c':0};
            cb = function(err,result) {
                var endTime = new Date().getTime(),
                    deltaTime = endTime - startTime;
                ++count[result.options.limiter];
		
		if(count[result.options.limiter] === 1){
		    expect(deltaTime).above(0);
                    expect(deltaTime).below(1500);
		}
                else if (count[result.options.limiter] === 2) {
                    expect(deltaTime).above(1500);
                    expect(deltaTime).below(3000);
                }else if (count[result.options.limiter] === 3) {
                    expect(deltaTime).above(3000);
                    expect(deltaTime).below(4500);
		    done();
                }
            };
	    
            startTime = new Date().getTime();
            c.queue([{
                uri: 'http://' + httpbinHost + '/ip',
		limiter:'a',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/user-agent',
		limiter:'b',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/headers',
		limiter:'a',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/headers',
		limiter:'c',
                callback: cb
            }, {
                uri: 'http://' + httpbinHost + '/headers',
		limiter:'a',
                callback: cb
            }]);
        });
    });
});
