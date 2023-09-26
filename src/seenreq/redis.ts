
'use strict';

const Repo = require('../../repo');

class MemRepo extends Repo{
	constructor(){
		super();
		this.cache = new Set();
	}

	getByKeys(keys){
		if(!keys || !(keys instanceof Array) )
			return Promise.reject(new Error('Arguments required!') );
		
		const rst = keys.map(this.cache.has, this.cache);
		
		return Promise.resolve(rst);
	}

	setByKeys(keys){
		if(!keys || !(keys instanceof Array) )
			return Promise.reject(new Error('Arguments required') );
			
		keys.forEach(this.cache.add, this.cache);
		return Promise.resolve();
	}

	dispose(callback) {
		this.cache = null;
		if(callback){
			callback();
		}else{
			return Promise.resolve();
		}
	}
}

module.exports = MemRepo;
