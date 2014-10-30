'use strict';

var util = require('util');
var crawler = require('./crawler');
module.exports = function debug() {
    if (crawler.debug) {
        console.error('CRAWLER %s', util.format.apply(util, arguments))
    }
};