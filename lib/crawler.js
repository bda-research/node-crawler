'use strict';

var path = require('path')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, request = require('request')
	, _ = require('lodash')
	, cheerio = require('cheerio')
	, fs = require('fs')
	, Bottleneck = require('bottleneckp')
	, seenreq = require('seenreq')
	, iconvLite = require('iconv-lite')
	, typeis = require('type-is').is
	, zlib = require('zlib')
	, qs = require('querystring'),
	URL = require('url').URL;

//NOTE for polyfill purpose, cause the http2 is just table for node 10.0
let http2;
try {
	http2 = require('http2');
} catch (e) { 
	//NOTE leave it empty for pass eslint
}

var whacko = null, level, levels = ['silly', 'debug', 'verbose', 'info', 'warn', 'error', 'critical'];
try {
	whacko = require('whacko');
} catch (e) {
	e.code;
}

function defaultLog() {    //2016-11-24T12:22:55.639Z - debug:
	if (levels.indexOf(arguments[0]) >= levels.indexOf(level))
		console.log(new Date().toJSON() + ' - ' + arguments[0] + ': CRAWLER %s', util.format.apply(util, Array.prototype.slice.call(arguments, 1)));
}

function checkJQueryNaming(options) {
	if ('jquery' in options) {
		options.jQuery = options.jquery;
		delete options.jquery;
	}
	return options;
}

function readJqueryUrl(url, callback) {
	if (url.match(/^(file:\/\/|\w+:|\/)/)) {
		fs.readFile(url.replace(/^file:\/\//, ''), 'utf-8', function (err, jq) {
			callback(err, jq);
		});
	} else {
		callback(null, url);
	}
}

function contentType(res) {
	return get(res, 'content-type').split(';').filter(item => item.trim().length !== 0).join(';');
}

function get(res, field) {
	return res.headers[field.toLowerCase()] || '';
}

var log = defaultLog;

function Crawler(options) {
	var self = this;

	options = options || {};
	if (['onDrain', 'cache'].some(key => key in options)) {
		throw new Error('Support for "onDrain", "cache" has been removed! For more details, see https://github.com/bda-research/node-crawler');
	}

	self.init(options);
}
// augment the prototype for node events using util.inherits
util.inherits(Crawler, EventEmitter);

Crawler.prototype.init = function init(options) {
	var self = this;

	var defaultOptions = {
		autoWindowClose: true,
		forceUTF8: true,
		gzip: true,
		incomingEncoding: null,
		jQuery: true,
		maxConnections: 10,
		method: 'GET',
		priority: 5,
		priorityRange: 10,
		rateLimit: 0,
		referer: false,
		retries: 3,
		retryTimeout: 10000,
		timeout: 15000,
		skipDuplicates: false,
		rotateUA: false,
		homogeneous: false,
		http2: false
	};

	// return defaultOptions with overridden properties from options.
	self.options = _.extend(defaultOptions, options);

	// you can use jquery or jQuery
	self.options = checkJQueryNaming(self.options);

	// Don't make these options persist to individual queries
	self.globalOnlyOptions = ['maxConnections', 'rateLimit', 'priorityRange', 'homogeneous', 'skipDuplicates', 'rotateUA'];

	self.limiters = new Bottleneck.Cluster(self.options.maxConnections, self.options.rateLimit, self.options.priorityRange, self.options.priority, self.options.homogeneous);

	//maintain the http2 sessions
	self.http2Connections = {};

	level = self.options.debug ? 'debug' : 'info';

	if (self.options.logger)
		log = self.options.logger.log.bind(self.options.logger);

	self.log = log;

	self.seen = new seenreq(self.options.seenreq);
	self.seen.initialize().then(() => log('debug', 'seenreq is initialized.')).catch(e => log('error', e));

	self.on('_release', function () {
		log('debug', `Queue size: ${this.queueSize}`);

		if (this.limiters.empty) {

			if (Object.keys(self.http2Connections).length > 0) self._clearHttp2Session();
			return this.emit('drain');
		}
		return null;
	});
};

Crawler.prototype.setLimiterProperty = function setLimiterProperty(limiter, property, value) {
	var self = this;

	switch (property) {
	case 'rateLimit': self.limiters.key(limiter).setRateLimit(value); break;
	default: break;
	}
};


Crawler.prototype.generateHttp2RequestLine = function (options) {
	const urlObj = new URL(options.uri);

	const requestLine = {
		':method': options.method || 'GET',
		':path': urlObj.pathname,
		':scheme': urlObj.protocol.replace(':', ''),
		':authority': urlObj.hostname
	};

	return requestLine;
};

Crawler.prototype.generateHttp2RequestBody = function (options) {
	let data = null;
	if (options.form) {
		if (!/^application\/x-www-form-urlencoded\b/.test(options.headers['content-type'])) {
			options.headers['content-type'] = 'application/x-www-form-urlencoded';
		}

		data = (typeof options.form === 'string') ? encodeURIComponent(options.form) : qs.stringify(options.form);
	} else if (options.json) {
		if (!/^application\/x-www-form-urlencoded\b/.test(options.headers['content-type'])) {
			data = JSON.stringify(options.body);
		}

		if (!options.headers['contentn-type']) options.headers['content-type'] = 'application/json';

	} else if (options.body !== undefined) {
		data = options.body;
	}

	//NOTE  the default situation do nothing to the 
	return data;
};

Crawler.prototype._inject = function _inject(response, options, callback) {
	var $;

	if (options.jQuery === 'whacko') {
		if (!whacko) {
			throw new Error('Please install whacko by your own since `crawler` detected you specify explicitly');
		}

		$ = whacko.load(response.body);
		callback(null, response, options, $);
	} else if (options.jQuery === 'cheerio' || options.jQuery.name === 'cheerio' || options.jQuery === true) {
		var defaultCheerioOptions = {
			normalizeWhitespace: false,
			xmlMode: false,
			decodeEntities: true
		};
		var cheerioOptions = options.jQuery.options || defaultCheerioOptions;
		$ = cheerio.load(response.body, cheerioOptions);

		callback(null, response, options, $);
	} else if (options.jQuery.jsdom) {
		var jsdom = options.jQuery.jsdom;
		var scriptLocation = path.resolve(__dirname, '../vendor/jquery-2.1.1.min.js');

		//Use promises
		readJqueryUrl(scriptLocation, function (err, jquery) {
			try {
				jsdom.env({
					url: options.uri,
					html: response.body,
					src: [jquery],
					done: function (errors, window) {
						$ = window.jQuery;
						callback(errors, response, options, $);

						try {
							window.close();
							window = null;
						} catch (err) {
							log('error', err);
						}

					}
				});
			} catch (e) {
				options.callback(e, { options }, options.release);
			}
		});
	}
	// Jquery is set to false are not set
	else {
		callback(null, response, options);
	}
};

Crawler.prototype.isIllegal = function isIllegal(options) {
	return (_.isNull(options) || _.isUndefined(options) || (!_.isString(options) && !_.isPlainObject(options)));
};

Crawler.prototype.direct = function direct(options) {
	var self = this;

	if (self.isIllegal(options) || !_.isPlainObject(options)) {
		return log('warn', 'Illegal queue option: ', JSON.stringify(options));
	}

	if (!('callback' in options) || !_.isFunction(options.callback)) {
		return log('warn', 'must specify callback function when using sending direct request with crawler');
	}

	options = checkJQueryNaming(options);

	// direct request does not follow the global preRequest
	options.preRequest = options.preRequest || null;

	_.defaults(options, self.options);

	// direct request is not allowed to retry
	options.retries = 0;

	// direct request does not emit event:'request' by default
	options.skipEventRequest = _.isBoolean(options.skipEventRequest) ? options.skipEventRequest : true;

	self.globalOnlyOptions.forEach(globalOnlyOption => delete options[globalOnlyOption]);

	self._buildHttpRequest(options);
	return null;
};

Crawler.prototype.queue = function queue(options) {
	var self = this;

	// Did you get a single object or string? Make it compatible.
	options = _.isArray(options) ? options : [options];

	options = _.flattenDeep(options);

	for (var i = 0; i < options.length; ++i) {
		if (self.isIllegal(options[i])) {
			log('warn', 'Illegal queue option: ', JSON.stringify(options[i]));
			continue;
		}
		self._pushToQueue(
			_.isString(options[i]) ? { uri: options[i] } : options[i]
		);
	}
};

Crawler.prototype._pushToQueue = function _pushToQueue(options) {
	var self = this;

	// you can use jquery or jQuery
	options = checkJQueryNaming(options);

	_.defaults(options, self.options);
	options.headers = _.assign({}, self.options.headers, options.headers);

	// Remove all the global options from our options
	// TODO we are doing this for every _pushToQueue, find a way to avoid this
	self.globalOnlyOptions.forEach(globalOnlyOption => delete options[globalOnlyOption]);

	// If duplicate skipping is enabled, avoid queueing entirely for URLs we already crawled
	if (!self.options.skipDuplicates) {
		self._schedule(options);
		return;
	}

	self.seen.exists(options, options.seenreq).then(rst => {
		if (!rst) {
			self._schedule(options);
		}
	}).catch(e => log('error', e));
};

Crawler.prototype._schedule = function _scheduler(options) {
	var self = this;
	//NOTE this will be used to add proxy outside the class
	self.emit('schedule', options);

	self.limiters.key(options.limiter || 'default').submit(options.priority, function (done, limiter) {
		options.release = function () { done(); self.emit('_release'); };
		if (!options.callback)
			options.callback = options.release;

		if (limiter) {
			self.emit('limiterChange', options, limiter);
		}

		if (options.html) {
			self._onContent(null, options, { body: options.html, headers: { 'content-type': 'text/html' } });
		} else if (typeof options.uri === 'function') {
			options.uri(function (uri) {
				options.uri = uri;
				self._buildHttpRequest(options);
			});
		} else {
			self._buildHttpRequest(options);
		}
	});

};

Crawler.prototype._clearHttp2Session = function _clearHttp2Session() {
	log('debug', `Crawler clear all ${Object.keys(this.http2Connections).length} http2 connections`);
	Object.keys(this.http2Connections).forEach(hostName => {
		this._closeAndDeleteHttp2Session(hostName);
		log('debug', `http2 connection to ${hostName} closed`);
	});
};

Crawler.prototype._closeAndDeleteHttp2Session = function _closeAndDeleteHttp2Session(targetHost) {
	if (this.http2Connections[targetHost]) {
		this.http2Connections[targetHost].close();
		delete this.http2Connections[targetHost];
	}
};

Crawler.prototype._buildHttpRequest = function _buildHTTPRequest(options) {
	var self = this;

	log('debug', options.method + ' ' + options.uri);
	if (options.proxy)
		log('debug', `Use proxy: ${options.proxy}`);

	// Cloning keeps the opts parameter clean:
	// - some versions of "request" apply the second parameter as a
	// property called "callback" to the first parameter
	// - keeps the query object fresh in case of a retry

	var ropts = _.assign({}, options);

	if (!ropts.headers) { ropts.headers = {}; }
	if (ropts.forceUTF8) { ropts.encoding = null; }
	// specifying json in request will have request sets body to JSON representation of value and
	// adds Content-type: application/json header. Additionally, parses the response body as JSON
	// so the response will be JSON object, no need to deal with encoding
	if (ropts.json) { options.encoding = null; }
	if (ropts.userAgent) {
		if (self.options.rotateUA && _.isArray(ropts.userAgent)) {
			ropts.headers['User-Agent'] = ropts.userAgent[0];
			// If "rotateUA" is true, rotate User-Agent
			options.userAgent.push(options.userAgent.shift());
		} else {
			ropts.headers['User-Agent'] = ropts.userAgent;
		}
	}

	if (ropts.referer) {
		ropts.headers.Referer = ropts.referer;
	}

	if (ropts.proxies && ropts.proxies.length) {
		ropts.proxy = ropts.proxies[0];
	}

	var doRequest = function (err) {
		if (err) {
			err.message = 'Error in preRequest' + (err.message ? ', ' + err.message : err.message);
			switch (err.op) {
			case 'retry': log('debug', err.message + ', retry ' + options.uri); self._onContent(err, options); break;
			case 'fail': log('debug', err.message + ', fail ' + options.uri); options.callback(err, { options: options }, options.release); break;
			case 'abort': log('debug', err.message + ', abort ' + options.uri); options.release(); break;
			case 'queue': log('debug', err.message + ', queue ' + options.uri); self.queue(options); options.release(); break;
			default: log('debug', err.message + ', retry ' + options.uri); self._onContent(err, options); break;
			}
			return;
		}

		//do http2.* request 
		if (ropts.http2) {
			if (!http2) {
				process.nextTick(() => {
					const notSupportedHttp2Error = new Error('you are trying to use http2 API which may not be supported for your current environment or node version');
					notSupportedHttp2Error.code = 'NOHTTP2SUPPORT';
					self._onContent(notSupportedHttp2Error, options);
				});
				return;
			}
			self._http2request(ropts, options);
		} else {
			if (ropts.skipEventRequest !== true) {
				self.emit('request', ropts);
			}

			var requestArgs = ['uri', 'url', 'qs', 'method', 'headers', 'body', 'form', 'formData', 'json', 'multipart', 'followRedirect', 'followAllRedirects', 'maxRedirects', 'removeRefererHeader', 'encoding', 'pool', 'timeout', 'proxy', 'auth', 'oauth', 'strictSSL', 'jar', 'aws', 'gzip', 'time', 'tunnel', 'proxyHeaderWhiteList', 'proxyHeaderExclusiveList', 'localAddress', 'forever', 'agent', 'strictSSL', 'agentOptions', 'agentClass'];

			request(_.pick.apply(self, [ropts].concat(requestArgs)), function (error, response) {
				if (error) {
					self._onContent(error, options);
				}else{
					self._onContent(error, options, response);
				}
			});
		}
	};

	if (options.preRequest && _.isFunction(options.preRequest)) {
		options.preRequest(ropts, doRequest);
	} else {
		doRequest();
	}
};

Crawler.prototype._buildHttp2Session = function _buildHttp2Session(targetHost) {
	const self = this;

	const newHttp2Connection = self.http2Connections[targetHost] = http2.connect(targetHost);

	log('debug', `connect to a new ${targetHost}`);

	newHttp2Connection.on('error', (err) => {
		log('warn', `Http2 stession error ${targetHost}, got error ${err}`);
	}).on('goaway', () => {
		log('debug', `Http2 session${targetHost} connection goaway`);
	}).on('connect', () => {
		log('debug', `Http2 session${targetHost} connection init`);
	}).once('close', () => {
		log('debug', `Http2 session ${targetHost} connection closed`);
	});
};

Crawler.prototype._http2request = function _http2request(ropts, options) {
	const self = this;

	const targetHost = new URL(ropts.uri).origin;
	ropts.headers = Object.assign(ropts.headers, self.generateHttp2RequestLine(ropts));
	const requestBody = ropts.headers[':method'] === 'GET' ? null : self.generateHttp2RequestBody(ropts);
	const response = {
		headers: {}
	};
	
	const chunks = [];
	let http2Error = null;

	if (!self.http2Connections[targetHost] || self.http2Connections[targetHost].destroyed) {
		self._buildHttp2Session(targetHost);
	}

	let req = null;
	try {
		req = self.http2Connections[targetHost].request(ropts.headers);//invoke request from http2session
	} catch (e) {
		//to handle the goaway issue， goaway will make the session can not be established
		//but it can not be detected at the moment that stream init
		//try catch seems the way to sovle it
		self._onContent(e, options, response);
		return;
	}

	const onData = chunk => chunks.push(chunk);
	const onError = e => {
		log('error',e);
		http2Error = e;
	};
	const onClose = () =>{
		if (http2Error) self._onContent(http2Error, options, response);
		else {
			response.body = Buffer.concat(chunks);
			self._onContent(null, options, response);
		}
	};

	const onEnd = () => {
		log('debug', `${ropts.uri} stream ends`);
	};
	
	req.on('response', headers => {
		//Where build the response obj
		response.statusCode = headers[':status'];
		response.request = {
			uri: `${req.sentHeaders[':scheme']}://${req.sentHeaders[':authority']}${req.sentHeaders[':path']}`,
			method: req.sentHeaders[':method'],
			headers: Object.assign({}, req.sentHeaders, req.sentInfoHeaders)
		};
		
		for (const name in headers) {
			response.headers[name] = headers[name];
		}
		
		let _s = null;
		switch (response.headers['content-encoding']) {
		case 'br':
			_s = req.pipe( zlib.createBrotliDecompress());
			break;
			// Or, just use zlib.createUnzip() to handle both of the following cases:
		case 'gzip':
			_s = req.pipe( zlib.createGunzip());
			break;
		case 'deflate':
			_s = req.pipe( zlib.createInflate());
			break;
		default:
			//req.pipe( output, onError);
			break;
		}
		
		if(!_s){
			return;
		}
		
		req.off('error', onError).off('data', onData).off('close', onClose).off('end', onEnd);
		_s.on('error', onError).on('data', onData).on('close',onClose).on('end',onEnd);
	});
	
	req.setTimeout(self.options.timeout);

	req.on('timeout', () => {
		const error = new Error('ESOCKETTIMEDOUT');
		error.code = 'ESOCKETTIMEDOUT';
		http2Error = error;
		req.close();
	});
	
	req.on('error', onError).on('data', onData).once('close', onClose).on('end', onEnd);

	//set request body
	req.end(requestBody);
};

Crawler.prototype._onContent = function _onContent(error, options, response) {
	var self = this;

	if (error) {
		switch (error.code) {
		case 'NOHTTP2SUPPORT':
			//if the enviroment is not support http2 api, all request rely on http2 protocol
			//are aborted immediately no matter how many retry times left
			log('error', 'Error ' + error + ' when fetching ' + (options.uri || options.url) + ' skip all retry times');
			break;
		default:
			log('error', 'Error ' + error + ' when fetching ' + (options.uri || options.url) + (options.retries ? ' (' + options.retries + ' retries left)' : ''));
			if (options.retries) {
				setTimeout(function () {
					options.retries--;
					self._schedule(options);
					options.release();
				}, options.retryTimeout);
				return;
			}
			break;
		}

		options.callback(error, { options: options }, options.release);

		return;
	}

	if (!response.body) { response.body = ''; }

	log('debug', 'Got ' + (options.uri || 'html') + ' (' + response.body.length + ' bytes)...');

	try {
		self._doEncoding(options, response);
	} catch (e) {
		return options.callback(e, { options: options }, options.release);
	}

	response.options = options;

	if (options.method === 'HEAD' || !options.jQuery) {
		return options.callback(null, response, options.release);
	}

	var injectableTypes = ['html', 'xhtml', 'text/xml', 'application/xml', '+xml'];
	if (!options.html && !typeis(contentType(response), injectableTypes)) {
		log('warn', 'response body is not HTML, skip injecting. Set jQuery to false to suppress this message');
		return options.callback(null, response, options.release);
	}

	log('debug', 'Injecting');

	self._inject(response, options, self._injected.bind(self));
};

Crawler.prototype._injected = function (errors, response, options, $) {
	log('debug', 'Injected');

	response.$ = $;
	options.callback(errors, response, options.release);
};

Crawler.prototype._doEncoding = function (options, response) {
	var self = this;

	if (options.encoding === null) {
		return;
	}

	if (options.forceUTF8) {
		var charset = options.incomingEncoding || self._parseCharset(response);
		response.charset = charset;
		log('debug', 'Charset ' + charset);

		if (charset !== 'utf-8' && charset !== 'ascii') {// convert response.body into 'utf-8' encoded buffer
			response.body = iconvLite.decode(response.body, charset);
		}
	}

	response.body = response.body.toString();
};

Crawler.prototype._parseCharset = function (res) {
	//Browsers treat gb2312 as gbk, but iconv-lite not.
	//Replace gb2312 with gbk, in order to parse the pages which say gb2312 but actually are gbk.
	function getCharset(str) {
		var charset = (str && str.match(/charset=['"]?([\w.-]+)/i) || [0, null])[1];
		return charset && charset.replace(/:\d{4}$|[^0-9a-z]/g, '') == 'gb2312' ? 'gbk' : charset;
	}
	function charsetParser(header, binary, default_charset = null) {
		return getCharset(header) || getCharset(binary) || default_charset;
	}

	var charset = charsetParser(contentType(res));
	if (charset)
		return charset;

	if (!typeis(contentType(res), ['html'])) {
		log('debug', 'Charset not detected in response headers, please specify using `incomingEncoding`, use `utf-8` by default');
		return 'utf-8';
	}

	var body = res.body instanceof Buffer ? res.body.toString() : res.body;
	charset = charsetParser(contentType(res), body, 'utf-8');

	return charset;
};

Object.defineProperty(Crawler.prototype, 'queueSize', {
	get: function () {
		return this.limiters.unfinishedClients;
	}
});

module.exports = Crawler;
