var EVALUATOR = {};

exports.evaluate = function(type, callback) {

	if (typeof(type) === 'function') {
		callback = type;
		type = 'default';
	}

	if (callback)
		EVALUATOR[type] = callback;
	else
		delete EVALUATOR[type];

};

function APICall() {
	var t = this;
	t.options = {};
}

const APICallProto = APICall.prototype;

APICallProto.promise = function($) {
	var t = this;
	var promise = new Promise(function(resolve, reject) {
		t.$callback = function(err, response) {
			if (err) {
				if ($ && $.invalid) {
					$.invalid(err);
					t.free();
				} else {
					err.name = 'API(' + t.options.name + ' --> ' + t.options.schema + ')';
					reject(err);
				}
			} else
				resolve(response);
		};
	});

	return promise;
};

APICallProto.done = function($, callback) {
	var t = this;
	t.$callback = function(err, response) {
		if (err)
			$.invalid(err);
		else
			callback && callback(response);
		t.free();
	};
	return t;
};

APICallProto.fail = function(cb) {
	this.$callback_fail = cb;
	return this;
};

APICallProto.data = function(cb) {
	this.$callback_data = cb;
	return this;
};

APICallProto.error = APICallProto.err = function(err, reverse) {
	this.$error = err + '';
	this.$error_reverse = reverse;
	return this;
};

APICallProto.callback = function($) {
	var t = this;
	t.$callback = typeof($) === 'function' ? $ : $.callback;
	return t;
};

APICallProto.evaluate = function(err, response) {

	var t = this;
	if (!err && t.$error) {
		if (t.$error_reverse) {
			if (response)
				err = t.$error;
			else if (response instanceof Array && response.length)
				err = t.$error;
		} else if (!response)
			err = t.$error;
		else if (response instanceof Array && !response.length)
			err = t.$error;
	}

	if (err)
		t.$callback_fail && t.$callback_fail(err);
	else
		t.$callback_data && t.$callback_data(response);

	t.$callback && t.$callback(err, response);
};

function execapi(api) {
	var conn = EVALUATOR[api.options.name] || EVALUATOR['*'];
	if (conn)
		conn.call(api, api.options, (err, response) => api.evaluate(err, response));
	else
		api.evaluate('API is not initialized');
}

exports.make = function(name, schema, model) {
	var api = new APICall();
	api.options.name = name;
	api.options.schema = schema;
	api.options.model = model;
	setImmediate(execapi, api);
	return api;
};