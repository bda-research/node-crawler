
'use strict';

import Crawler from '../dist/index.js';
import { expect } from 'chai';
import { given } from 'mocha-testdata';

describe('Unsupported function test', function() {
	given.async('onDrain','preRequest','cache')
		.it('should throw exception when using  unsupported options', function(done,key) {
			const opt = {
				maxConnections: 10
			};
			
			opt[key] = {};
			expect(function(){Crawler(opt);}).to.throw(Error);
			done();
		});
});
