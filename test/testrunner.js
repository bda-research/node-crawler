#!/usr/bin/env node

var testrunner = require( "qunit" ),

path = require( "path" ).normalize( __dirname + "/.." );
    
testrunner.run([
        {
            code: path + "/lib/crawler.js",
            tests: [ path + "/test/selector.js"]
        }    
]);
