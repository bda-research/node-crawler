var Crawler = require('../../lib/crawler').Crawler;

QUnit.module('simple');

var DEBUG = false;
var MOCKPORT = 30045;


test('inline html', function() {
    expect(2);

    stop();

    var c = new Crawler({
        debug: DEBUG,
        onDrain: function() {
            start();
        }
    });

    c.queue({
        html: '<p><i>great!</i></p>',
        callback: function(error, result, $) {
            equal(error, null);
            equal($('i').html(), 'great!');
        }
    });

});


test('one request', function() {
    expect(2);
    stop();

    var c = new Crawler({
        debug: DEBUG,
        onDrain: function() {
            start();
        },
        callback: function(error, result, $) {
            equal(error, null);
            ok(result.body.length > 1000);
        }
    });

    c.queue(['http://google.com/']);

});

test('two requests', function() {
    expect( 4 );

    stop();

    var c = new Crawler({
        debug: DEBUG,
        onDrain: function() {
            start();
        },
        callback: function(error, result, $) {
            equal(error, null);
            ok(result.body.length > 1000);
            
        }
    });

    c.queue(['http://google.com/', 'http://google.fr/']);
});


test('one request gzipped', function() {
    expect(3);
    stop();

    var c = new Crawler({
        debug:DEBUG,
        onDrain: function() {
            start();
        },
        callback:function(error,result,$) {
            equal(error,null);
            ok(result.body.indexOf('User-Agent')>0);
            ok(result.headers['content-encoding']=='gzip');
        }
    });

    c.queue(['http://httpbin.org/gzip']);
});


test('one request + user agent', function() {
    expect( 2 );
    stop();

    var c = new Crawler({
        debug: DEBUG,
        userAgent: 'test/1.2',
        jQuery: false,
        onDrain: function() {
            start();
        },
        callback: function(error, result, $) {
            equal(error, null);
            ok(result.body === 'Your user agent: test/1.2');
        }
    });

    c.queue(['http://127.0.0.1:' + MOCKPORT + '/echo_useragent']);
});


test('Auto-disabling of jQuery if no html tag first', function() {
    expect(2);
    stop();

    var c = new Crawler({
        debug: DEBUG,
        onDrain: function() {
            start();
        },
        userAgent: 'test/1.2',
        forceUTF8: true,
        callback: function(error, result, $) {
            equal(error, null);
            ok(result.body === 'Your user agent: test/1.2');
        }
    });

    c.queue(['http://127.0.0.1:'+MOCKPORT+'/echo_useragent']);
});


test('from the readme',function() {

    expect( 2 );
    stop();

    var c = new Crawler({
        maxConnections: 10,
        onDrain: function() {
            start();
        },
        callback: function(error, result, $) {
            equal(typeof result.body, 'string');
            if (typeof result.body === 'string') {
                ok(result.body.indexOf('Google') >= 0);
            } else {
                ok(true);
            }
        }
    });
    c.queue('http://google.com');
});