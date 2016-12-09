'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';

describe('Limits', function() {
    describe('rate limits', function() {
        var startTime, c, cb;
        // beforeEach(function() {
        //     c = new Crawler({
        //         rateLimit: 5000,
	// 	maxConnections:1
        //     });
        // });
        it('should delay 2000 milliseconds between each requests', function(done) {
	    cb = function(e,res,next) {
                var endTime = new Date().getTime(),
                    deltaTime = endTime - startTime;
                count++;
		next()
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
	    c = new Crawler({
		rateLimit: 2000,
		jQuery:false,
		maxConnections:1,
		callback:cb
	    });
            this.timeout(20000);
            var count = 0;            
	    
            startTime = new Date().getTime();
            c.queue(['http://' + httpbinHost + '/ip','http://' + httpbinHost + '/user-agent','http://' + httpbinHost + '/headers']);
        });
	it('should delay certain time between requests of key', function(done) {
	    c = new Crawler({
		rateLimit: 1500,
		jQuery:false,
		maxConnections:3
	    });
            this.timeout(20000);
            var count = {'a':0,'b':0,'c':0};
            cb = function(err,res,next) {
                var endTime = new Date().getTime(),
                    deltaTime = endTime - startTime;
                ++count[res.options.limiter];
		next()
		if(count[res.options.limiter] === 1){
		    expect(deltaTime).above(0);
                    expect(deltaTime).below(1500);
		}
                else if (count[res.options.limiter] === 2) {
                    expect(deltaTime).above(1500);
                    expect(deltaTime).below(3000);
                }else if (count[res.options.limiter] === 3) {
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
