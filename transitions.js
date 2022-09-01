// Proof of Concept

require('./index');

F.transitions = {};

function Transition() {
	var t = this;
	t.actions = {};
}

function TransitionOptions() {}

TransitionOptions.prototype = {

	get client() {
		return this.controller;
	},

	get value() {
		return this.model;
	},

	get test() {
		return this.controller ? this.controller.test : false;
	},

	get user() {
		return this.controller ? this.controller.user : null;
	},

	get session() {
		return this.controller ? this.controller.session : null;
	},

	get sessionid() {
		return this.controller ? this.controller.sessionid : null;
	},

	get url() {
		return (this.controller ? this.controller.url : '') || '';
	},

	get uri() {
		return this.controller ? this.controller.uri : null;
	},

	get path() {
		return (this.controller ? this.controller.path : EMPTYARRAY);
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

	get id() {
		return this.controller ? this.controller.id : null;
	},

	get req() {
		return this.controller ? this.controller.req : null;
	},

	get res() {
		return this.controller ? this.controller.res : null;
	},

	get params() {
		return this.controller ? this.controller.params : null;
	},

	get files() {
		return this.controller ? this.controller.files : null;
	},

	get body() {
		return this.controller ? this.controller.body : null;
	},

	get query() {
		return this.controller ? this.controller.query : null;
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
		item.validate = function(type, value) {
			var error = new ErrorBuilder();
			var response = framework_jsonschema.transform(type === 'input' ? this.jsonschemainput : this.jsonschemaoutput, error, value);
			return { error: error.is ? error : null, response: response };
		};
	}

	return t;
};

TOP.callback = function(value) {

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
	if (t.$executed && t.$callback) {
		t.error.push(err);
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

	if (obj.action.jsonschemainput) {
		var res = obj.action.validate('input', obj.data || EMPTYOBJECT);
		if (res.error) {
			obj.$callback && obj.$callback(res.error);
			return;
		}
	}

	obj.action.exec.call(obj.action, obj);
}

global.TRANSITION = function(name, data, callback, controller) {

	var arr = name.split(/-->/).trim();
	var obj = new TransitionOptions();

	obj.controller = controller ? (controller.controller || controller) : null;
	obj.data = obj.model = data;
	obj.$callback = callback;

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

	setImmediate(exectransition, obj);
	return obj;
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