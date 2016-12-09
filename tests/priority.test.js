'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var httpbinHost = 'localhost:8000';
var c;
var spf = [0,0,0];
var cnt = 0;

describe('Priority test', function() {    
    beforeEach(function() {
        c = new Crawler({
                maxConnections: 1
            });

        c.queue([{
            uri: 'http://'+httpbinHost+'/links/0',
            priority: 4,
            callback: function(error, res, havedone) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
                havedone();
            }
        }]);

        c.queue([{
            uri: 'http://'+httpbinHost+'/links/4',
            priority: 3,
            callback: function(error, res, havedone) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
		var $ = res.$;
                spf[cnt++] = $('body').text().charAt($('body').text().length -2);
                havedone();
            }
        }]);

        c.queue([{
            uri: 'http://'+httpbinHost+'/links/5',
            priority: 2,
            callback: function(error, res, havedone) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
		var $ = res.$;
                spf[cnt++] = $('body').text().charAt($('body').text().length -2);
                havedone();
            }
        }]);

        c.queue([{
            uri: 'http://'+httpbinHost+'/links/6',
            priority: 1,
            callback: function(error, res, havedone) //noinspection BadExpressionStatementJS,BadExpressionStatementJS
            {
		var $ = res.$;
                spf[cnt++] = $('body').text().charAt($('body').text().length -2);
                havedone();
            }
        }]);
    });

    it('should res in order', function(done) {
        this.timeout(5000);
        setTimeout(function() {
            expect(spf[0]).to.equal('5');
            expect(spf[1]).to.equal('4');
            expect(spf[2]).to.equal('3');
            done();
        }, 1000);
    });
});
