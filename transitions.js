// Proof of Concept

require('./index');

F.transitions = {};

function Transition() {
	var t = this;
	t.actions = {};
}

function TransitionInit() {}

var TIP = TransitionInit.prototype;

TIP.params = function(value) {
	this.options.params = value;
	return this;
};

TIP.query = function(value) {
	this.options.query = value;
	return this;
};

TIP.user = function(value) {
	this.options.user = value;
	return this;
};

TIP.session = function(value) {
	this.options.session = value;
	return this;
};

TIP.callback = function(value) {
	this.options.$callback = value;
	return this;
};

TIP.configure = function(config) {
	this.options.config = config;
	return this;
};

TIP.promise = function($) {
	var t = this;
	return new Promise(function(resolve, reject) {
		t.options.$callback = function(err, response) {
			if (err) {
				if ($ && $.invalid)
					$.invalid(err);
				else
					reject(err);
			} else
				resolve(response);
		};
	});
};

function TransitionOptions() {}

TransitionOptions.prototype = {

	get client() {
		return this.controller;
	},

	get test() {
		return this.controller ? this.controller.test : false;
	},

	get split() {
		return (this.controller ? this.controller.split : EMPTYARRAY);
	},

	get language() {
		return (this.controller ? this.controller.language : '') || '';
	},

	get ip() {
		return this.controller ? this.controller.ip : null;
	},

	get req() {
		return this.controller ? this.controller.req : null;
	},

	get res() {
		return this.controller ? this.controller.res : null;
	},

	get files() {
		return this.controller ? this.controller.files : null;
	},

	get body() {
		return this.controller ? this.controller.body : null;
	},

	get mobile() {
		return this.controller ? this.controller.mobile : null;
	},

	get headers() {
		return this.controller ? this.controller.headers : null;
	},

	get ua() {
		return this.controller ? this.controller.ua : null;
	}
};

var TP = Transition.prototype;
var TOP = TransitionOptions.prototype;

TP.refresh = function() {

	var t = this;

	for (var key in t.actions) {
		var item = t.actions[key];
		item.jsonschemainput = item.input ? item.input.toJSONSchema(key + '_input') : null;
		item.jsonschemaoutput = item.output ? item.output.toJSONSchema(key + '_output') : null;
		item.jsonschemaparams = item.params ? item.params.toJSONSchema(key + '_params') : null;
		item.jsonschemaquery = item.query ? item.query.toJSONSchema(key + '_query') : null;
		item.validate = function(type, value) {
			var jsonschema = this['jsonschema' + type];
			if (jsonschema) {
				var error = new ErrorBuilder();
				var response = framework_jsonschema.transform(jsonschema, error, value);
				return { error: error.is ? error : null, response: response };
			} else
				return { error: null, response: value };
		};
	}

	return t;
};

TIP.output = TOP.callback = function(value) {

	var t = this;

	if (!t.$executed) {
		t.$callback = value;
		return t;
	}

	if (t.$callback) {
		var data = t.action.validate('output', value);
		t.$callback(null, data.response);
		t.$callback = null;
	}

	return t;
};

TOP.invalid = function(err) {
	var t = this;

	t.error = new ErrorBuilder();
	t.error.push(err);

	if (t.$callback) {
		t.$callback(t.error);
		t.$callback = null;
	}

	return t;
};

TOP.configure = function(config) {
	this.config = config;
	return this;
};

TOP.promise = function($) {

	var t = this;

	if (t.$executed)
		return;

	return new Promise(function(resolve, reject) {
		t.$callback = function(err, response) {
			if (err) {
				if ($ && $.invalid)
					$.invalid(err);
				else
					reject(err);
			} else
				resolve(response);
		};
	});
};

function exectransition(obj) {

	obj.$executed = true;

	if (obj.$error) {
		obj.$callback && obj.$callback(obj.$error);
		return;
	}

	if (obj.action.jsonschemaparams) {
		var res = obj.action.validate('params', obj.params || EMPTYOBJECT);
		if (res.error) {

			for (var item of res.error.items)
				item.source = 'params';

			obj.$callback && obj.$callback(res.error);
			return;
		}
		obj.params = res.response;
	}

	if (obj.action.jsonschemaquery) {
		var res = obj.action.validate('query', obj.query || EMPTYOBJECT);
		if (res.error) {

			for (var item of res.error.items)
				item.source = 'query';

			obj.$callback && obj.$callback(res.error);
			return;
		}
		obj.query = res.response;
	}

	if (obj.action.jsonschemainput) {
		var res = obj.action.validate('input', obj.data || EMPTYOBJECT);
		if (res.error) {
			obj.$callback && obj.$callback(res.error);
			return;
		}
		obj.data = obj.model = obj.value = res.response;
	} else
		obj.model = obj.value = obj.data || EMPTYOBJECT;

	obj.action.exec.call(obj.action, obj);
}

global.TRANSITION = function(name, data, callback, controller) {

	var arr = name.split(/-->/).trim();
	var obj = new TransitionOptions();

	obj.controller = controller ? (controller.controller || controller) : null;
	obj.$callback = callback;
	obj.data = data;

	var item = F.transitions[arr[0]];
	if (!item) {
		obj.$error = 'The transition "{0}" not found'.format(arr[0]);
	} else if (!item.ready) {
		obj.$error = 'The transition "{0}" is not ready to use'.format(arr[0]);
	} else {
		var action = item.actions[arr[1]];
		if (action)
			obj.action = action;
		else
			obj.$error = 'The input "{0}" not found in the "{1}" transition'.format(arr[1], arr[0]);
		obj.transition = item;
		obj.config = item.config;
	}

	var init = new TransitionInit();
	init.options = obj;

	setImmediate(exectransition, obj);
	return init;
};

global.NEWTRANSITION = function(name, fn) {

	if (name.indexOf(';') !== -1) {
		var fn = new Function('exports', 'require', name);
		NEWTRANSITION('', fn);
		return;
	}

	var meta;

	// Removing
	if (!fn && name) {
		meta = F.transitions[name];
		if (meta) {
			meta.uninstall && meta.uninstall();
			meta = null;
			delete F.transitions[name];
		}
		return;
	}

	meta = new Transition();

	if (typeof(fn) === 'function')
		fn(meta, F.require);
	else
		U.copy(fn, meta);

	if (!name)
		name = meta.name;

	var prev = F.transitions[name];
	if (prev) {
		prev.uninstall && prev.uninstall();
		prev = null;
	}

	var init = function() {
		if (meta.npm && meta.npm.length) {
			NPMINSTALL(meta.npm, function() {
				meta.refresh();
				meta.install && meta.install();
				meta.ready = true;
			});
		} else {
			meta.refresh();
			meta.install && meta.install();
			meta.ready = true;
		}
	};

	F.transitions[name] = meta;

	if (prev)
		setTimeout(init, 1000);
	else
		init();
};