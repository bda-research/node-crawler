#!/usr/bin/env node

var testrunner = require( "qunit" ),

    path = require( "path" ).normalize( __dirname + "/.." );
    

    
    testrunner.run([
        {
            code: path + "/lib/apricot.js",
            tests: [ path + "/test/selector.js"]
        }    
    ]);
