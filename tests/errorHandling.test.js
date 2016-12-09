'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var jsdom = require('jsdom');
var httpbinHost = 'localhost:8000';

describe('Errors', function() {
    describe('timeout', function() {
        var c = new Crawler({
            timeout : 1500,
            retryTimeout : 1000,
            retries : 2,
            jquery : false
        });
        it('should return a timeout error after ~5sec', function(done) {

            // override default mocha test timeout of 2000ms
            this.timeout(10000);

            c.queue({
                uri : 'http://'+httpbinHost+'/delay/3',
                callback : function(error, response) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
                {
                    expect(error).not.to.be.null;
                    expect(error.code == "ETIMEDOUT" || error.code == "ESOCKETTIMEDOUT" ).to.be.true;
		 //    if(process.version.replace(/^v/,'').split('.')[0] > '4'){
   //          expect(error.code).to.equal("ESOCKETTIMEDOUT");
			
		 //    }else{
			// expect(error.code).to.equal("ETIMEDOUT");
		 //    }

                    //expect(response).to.be.undefined;
                    done();
                }
            });
        });
        it('should retry after a first timeout', function(done) {

            // override default mocha test timeout of 2000ms
            this.timeout(15000);

            c.queue({
                uri : 'http://'+httpbinHost+'/delay/1',
                callback : function(error, response) {
                    expect(error).to.be.null;
                    expect(response.body).to.be.ok;
                    done();
                }
            });
        });
    });

    describe('error status code', function() {
        var c = new Crawler({
            jQuery : false
        });
        it('should not return an error on status code 400 (Bad Request)', function(done) {
            c.queue({
                uri: 'http://' + httpbinHost + '/status/400',
                callback: function(error, response){
                    expect(error).to.be.null;
                    expect(response.statusCode).to.equal(400);
                    done();
                }
            });
        });
        it('should not return an error on status code 401 (Unauthorized)', function(done) {
            c.queue({
                uri: 'http://' + httpbinHost + '/status/401',
                callback: function(error, response){
                    expect(error).to.be.null;
                    expect(response.statusCode).to.equal(401);
                    done();
                }
            });
        });
        it('should not return an error on status code 403 (Forbidden)', function(done) {
            c.queue({
                uri: 'http://' + httpbinHost + '/status/403',
                callback: function(error, response){
                    expect(error).to.be.null;
                    expect(response.statusCode).to.equal(403);
                    done();
                }
            });
        });
        it('should not return an error on a 404', function(done) {
            c.queue({
                uri : 'http://'+httpbinHost+'/status/404',
                callback : function(error, response) {
                    expect(error).to.be.null;
                    expect(response.statusCode).to.equal(404);
                    done();
                }
            });
        });
        it('should not return an error on a 500', function(done) {
            c.queue({
                uri : 'http://'+httpbinHost+'/status/500',
                callback : function(error, response) {
                    expect(error).to.be.null;
                    expect(response.statusCode).to.equal(500);
                    done();
                }
            });
        });
        it('should not failed on empty response', function(done) {
            c.queue({
                uri : 'http://'+httpbinHost+'/status/204',
                callback : function(error) {
                    expect(error).to.be.null;
                    done();
                }
            });
        });
        it('should not failed on a malformed html if jquery is false', function(done) {
            c.queue({
                html : '<html><p>hello <div>dude</p></html>',
                callback : function(error, response) {
                    expect(error).to.be.null;
                    expect(response).not.to.be.null;
                    done();
                }
            });
        });
        it('should not return an error on a malformed html if jQuery is jsdom', function(done) {
            c.queue({
                html : '<html><p>hello <div>dude</p></html>',
                jQuery : jsdom,
                callback : function(error, response) {
                    expect(error).to.be.null;
                    expect(response).not.to.be.undefined;
                    done();
                }
            });
        });
    });
});
