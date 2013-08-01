#!/usr/bin/env node

var testrunner = require( "qunit" ),

path = require( "path" ).normalize( __dirname + "/.." );
    
testrunner.setup({

});

var mockserver = require("./mockserver").app;

mockserver.listen(30045);

testrunner.run([
        {
            code: path + "/lib/crawler.js",
            tests: [
             path + "/test/units/simple.js",
              path + "/test/units/links.js",
             
              path + "/test/units/forceutf8.js",
              
              path + "/test/units/errors.js",
             
              path + "/test/units/leaks.js"
  
            ]
        }
],function(err, report) {
  console.log("Stopping mockserver...");
  mockserver.close();
  process.exit((err || report.failed !== 0) ? 1 : 0);
});
