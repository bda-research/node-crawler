
'use strict';

const crypto = require('crypto');

/* Repo is an abstract class
 *
 *
 */
class Repo{
	initialize(){
		return Promise.resolve();
	}

	/*
     * - normalizedReq, Array
     *   - sign, String
     *   - options, Object, this is options for one request
     * - options, Object, this is options for all requests
     * - callback, Function
     *
     * Priority of two options : normalizedReq.options > options
     */
	exists(normalizedReq, options){
		const req = normalizedReq;
		const slots = {};
		const uniq = [];
		const keysToInsert = {};
		const rst = new Array(req.length);

		for (let i = 0; i < req.length; i++) {
			const reqOptions = Object.assign({},options,req[i].options);
			const key = this.transformKey(req[i].sign);
			if (key in slots) {
				rst[i] = true;
			} else {
				rst[i] = false;
				slots[key] = i;
				uniq.push(key);
				keysToInsert[key] = null;
				
				if (reqOptions.rupdate === false) {
					delete keysToInsert[key];
				}
			}
		}
		
		return this.getByKeys(uniq).then( (result) => {
			const ifTruthy = (key) => key==='1' || key===1 || key==='true' || key===true ;
			
			for (let j = 0; j < uniq.length; j++) {
				if (ifTruthy(result[j])) {
					rst[slots[uniq[j]]] = true;
					delete keysToInsert[uniq[j]];
				} else {
					rst[slots[uniq[j]]] = false;
				}
			}

			return this.setByKeys(Object.keys(keysToInsert));
		}).then( () => {
			return rst;
		});
	}

	/*
     * 
     * @return Array, transformed keys
     *
     */
	transformKey(key){
		const hash = (str) => {
			const hashFn = crypto.createHash('md5');
			hashFn.update(str);
			return hashFn.digest('hex');
		};
		
		return hash(key);
	}

	dispose(){
		throw new Error('`dispose` not implemented');
	}
}

module.exports = Repo;
