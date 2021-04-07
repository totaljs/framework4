'use strict';

const DEFAULT_SCHEMA = 'default';
const REGEXP_CLEAN_EMAIL = /\s/g;
const REGEXP_CLEAN_PHONE = /\s|\.|-|\(|\)/g;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const BOOL = { true: 1, on: 1, '1': 1 };

var schemas = {};
var schemasall = {};
var operations = {};
var tasks = {};
var transforms = { pagination: {}, error: {}, restbuilder: {} };
var restbuilderupgrades = [];

function SchemaValue() {}

function SchemaOptions(error, model, options, callback, controller, name, schema) {
	this.error = error;
	this.model = model;
	this.options = options || EMPTYOBJECT;
	this.callback = this.next = callback;
	this.controller = (controller instanceof SchemaOptions || controller instanceof OperationOptions || controller instanceof TaskBuilder) ? controller.controller : controller;
	this.name = name;
	this.schema = schema;
	this.responses = {};
}

function TaskBuilder($) {
	var t = this;
	t.value = {};
	t.tasks = {};
	if ($ instanceof SchemaOptions || $ instanceof OperationOptions || $ instanceof TaskBuilder) {
		t.schema = $.schema;
		t.error = $.error;
		t.controller = $.controller;
	} else {
		if ($ instanceof Controller || $ instanceof WebSocketClient)
			t.controller = $;
		else if ($ instanceof ErrorBuilder)
			t.error = $;
	}
}

TaskBuilder.prototype = {

	get test() {
		return this.controller ? this.controller.test : false;
	},

	get user() {
		return this.controller ? this.controller.req.user : null;
	},

	get session() {
		return this.controller ? this.controller.session : null;
	},

	get sessionid() {
		return this.controller && this.controller ? this.controller.req.sessionid : null;
	},

	get language() {
		return (this.controller ? this.controller.language : '') || '';
	},

	get ip() {
		return this.controller ? this.controller.req.ip : null;
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
		return this.controller ? this.controller.req.files : null;
	},

	get body() {
		return this.controller ? this.controller.req.body : null;
	},

	get query() {
		return this.controller ? this.controller.req.query : null;
	},

	get mobile() {
		return this.controller ? this.controller.req.mobile : null;
	},

	get model() {
		return this.value;
	},

	set model(val) {
		this.value = val;
	},

	get headers() {
		return this.controller ? this.controller.req.headers : null;
	},

	get ua() {
		return this.controller ? this.controller.req.ua : null;
	},

	get filter() {
		var ctrl = this.controller;
		if (ctrl && !ctrl.$filter)
			ctrl.$filter = ctrl.$filterschema ? CONVERT(ctrl.query, ctrl.$filterschema) : ctrl.query;
		return ctrl ? ctrl.$filter : EMPTYOBJECT;
	}
};

const TaskBuilderProto = TaskBuilder.prototype;

TaskBuilderProto.encrypt = function(value) {
	if (this.req)
		this.req.$bodyencrypt = value == null || value === true;
	return this;
};

SchemaOptions.prototype = {

	get value() {
		return this.model;
	},

	get test() {
		return this.controller ? this.controller.test : false;
	},

	get user() {
		return this.controller ? this.controller.req.user : null;
	},

	get session() {
		return this.controller ? this.controller.req.session : null;
	},

	get repo() {
		if (this.controller)
			return this.controller.repository;
		if (!this.$$repository)
			this.$$repository = {};
		return this.$$repository;
	},

	get sessionid() {
		return this.controller && this.controller ? this.controller.req.sessionid : null;
	},

	get url() {
		return (this.controller ? this.controller.req.url : '') || '';
	},

	get language() {
		return (this.controller ? this.controller.language : '') || '';
	},

	get ip() {
		return this.controller ? this.controller.req.ip : null;
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
		return this.controller ? this.controller.req.files : null;
	},

	get body() {
		return this.controller ? this.controller.req.body : null;
	},

	get query() {
		return this.controller ? this.controller.req.query : null;
	},

	get mobile() {
		return this.controller ? this.controller.req.mobile : null;
	},

	get headers() {
		return this.controller ? this.controller.req.headers : null;
	},

	get ua() {
		return this.controller ? this.controller.req.ua : null;
	},

	get filter() {
		var ctrl = this.controller;
		if (ctrl && !ctrl.$filter)
			ctrl.$filter = ctrl.$filterschema ? CONVERT(ctrl.query, ctrl.$filterschema) : ctrl.query;
		return ctrl ? ctrl.$filter : EMPTYOBJECT;
	}
};

var SchemaOptionsProto = SchemaOptions.prototype;

SchemaOptionsProto.cancel = function() {
	var self = this;

	if (self.$async) {
		self.$async.tasks = null;
		self.$async.op = null;
		self.$async = null;
	}

	self.callback = self.next = null;
	self.error = null;
	self.controller = null;
	self.model = null;
	self.options = null;
	return self;
};

SchemaOptionsProto.extend = function(data, callback) {

	var self = this;
	var ext = self.schema.extensions[self.name];
	if (ext) {

		if (callback) {
			ext.wait(function(fn, next) {
				self.next = next;
				fn(self, data, next);
			}, callback);
		} else {
			self.next = NOOP;
			for (var i = 0; i < ext.length; i++)
				ext[i](self, data, NOOP);
		}

		return true;
	} else if (callback)
		callback();
};

SchemaOptionsProto.redirect = function(url) {
	this.callback(new F.callback_redirect(url));
	return this;
};

SchemaOptionsProto.audit = function(message, type) {
	AUDIT(this, message, type);
	return this;
};

TaskBuilderProto.clean = function() {
	return this.value;
};

SchemaOptionsProto.clean = function() {
	return this.model;
};

SchemaOptionsProto.response = function(index) {
	return this.responses[index];
};

SchemaOptionsProto.successful = function(callback) {
	var self = this;
	return function(err, a, b, c) {
		if (err)
			self.invalid(err);
		else
			callback.call(self, a, b, c);
	};
};

SchemaOptionsProto.success = function(a, b) {

	if (a && b === undefined && typeof(a) !== 'boolean') {
		b = a;
		a = true;
	}

	var o = SUCCESS(a === undefined ? true : a, b);

	// Because if the response will contain same SUCCESS() objects then the value will be same due to reference
	if (this.$multiple) {
		var obj = {};
		for (var m in o) {
			if (o[m] != null)
				obj[m] = o[m];
		}
		o = obj;
	}

	this.callback(o);
	return this;
};

SchemaOptionsProto.done = function(arg) {

	var self = this;

	return function(err, response) {

		if (err) {

			if (self.error !== err)
				self.error.push(err);

			self.callback();

		} else {

			var o;

			if (arg)
				o = SUCCESS(err == null, arg === true ? response : arg);
			else
				o = SUCCESS(err == null);

			// Because if the response will contain same SUCCESS() objects then the value will be same due to reference
			if (self.$multiple) {
				var obj = {};
				for (var m in o) {
					if (o[m] != null)
						obj[m] = o[m];
				}
				o = obj;
			}

			self.callback(o);
		}
	};
};

SchemaOptionsProto.invalid = function(name, error, path, index) {
	var self = this;

	if (arguments.length) {
		self.error.push(name, error, path, index);
		self.callback();
		return self;
	}

	return function(err) {
		self.error.push(err);
		self.callback();
	};
};

SchemaOptionsProto.noop = function() {
	this.callback(NoOp);
	return this;
};

function SchemaBuilderEntity(name) {
	this.name = name;
	// this.primary;
	this.trim = true;
	this.schema = {};
	this.meta = {};
	this.properties = [];
	this.inherits = [];
	this.verifications = null;
	// this.resourcePrefix;
	this.extensions = {};

	// this.resourceName;
	// this.workflows;
	// this.onSave;
	// this.onInsert;
	// this.onUpdate;
	// this.onRead;
	// this.onRemove;
	// this.onQuery;
	// this.onError;
	// this.dependencies;
	// this.fields_allow;
	this.fields = [];
}

const SchemaBuilderEntityProto = SchemaBuilderEntity.prototype;

SchemaBuilderEntityProto.csrf = function(value) {
	this.$csrf = value == null || value === true;
	return this;
};

SchemaBuilderEntityProto.encrypt = function(value) {
	this.$bodyencrypt = value == null || value === true;
	return this;
};

SchemaBuilderEntityProto.compress = function(value) {
	this.$bodycompress = value == null || value === true;
	return this;
};

SchemaBuilderEntityProto.allow = function() {
	var self = this;

	if (!self.fields_allow)
		self.fields_allow = [];

	var arr = arguments;

	if (arr.length === 1)
		arr = arr[0].split(',').trim();

	for (var i = 0; i < arr.length; i++) {
		if (arr[i] instanceof Array) {
			for (var j = 0; j < arr[i].length; j++)
				self.fields_allow.push(arr[i][j]);
		} else
			self.fields_allow.push(arr[i]);
	}
	return self;
};

SchemaBuilderEntityProto.before = function(name, fn) {
	var self = this;
	if (!self.preparation)
		self.preparation = {};
	self.preparation[name] = fn;
	return self;
};

SchemaBuilderEntityProto.required = function(name, fn) {

	var self = this;

	if (!name)
		return self;

	if (name.indexOf(',') !== -1) {
		var arr = name.split(',');
		for (var i = 0; i < arr.length; i++)
			self.required(arr[i].trim(), fn);
		return self;
	}

	if (fn === false) {
		self.properties && (self.properties = self.properties.remove(name));
		return self;
	}

	var prop = self.schema[name];
	if (!prop)
		throw new Error('Property "{0}" doesn\'t exist in "{1}" schema.'.format(name, self.name));

	prop.can = typeof(fn) === 'function' ? fn : null;

	if (!prop.required) {
		prop.required = true;
		if (self.properties) {
			self.properties.indexOf(name) === -1 && self.properties.push(name);
		} else
			self.properties = [name];
	}

	return self;
};

SchemaBuilderEntityProto.clear = function() {
	var self = this;

	self.schema = {};
	self.properties = [];
	self.fields = [];
	self.verifications = null;

	if (self.preparation)
		self.preparation = null;

	if (self.dependencies)
		self.dependencies = null;

	if (self.fields_allow)
		self.fields_allow = null;

	return self;
};

SchemaBuilderEntityProto.middleware = function(fn) {
	var self = this;
	if (!self.middlewares)
		self.middlewares = [];
	self.middlewares.push(fn);
	return self;
};

function runmiddleware(opt, schema, callback, index, processor) {

	if (!index)
		index = 0;

	var fn = schema.middlewares[index];

	if (!fn) {
		callback.call(schema, opt, opt.model);
		return;
	}

	if (processor) {
		fn(opt, processor);
		return;
	}

	processor = function(stop) {
		if (!stop)
			runmiddleware(opt, schema, callback, index + 1, processor);
	};

	fn(opt, processor);
}

SchemaBuilderEntityProto.define = function(name, type, required, custom) {

	if (name instanceof Array) {
		for (var i = 0, length = name.length; i < length; i++)
			this.define(name[i], type, required, custom);
		return this;
	}

	var rt = typeof(required);

	if (required !== undefined && rt === 'string') {
		custom = required;
		required = false;
	}

	if (type == null) {
		// remove
		delete this.schema[name];
		this.properties = this.properties.remove(name);
		if (this.dependencies)
			this.dependencies = this.dependencies.remove(name);
		this.fields = Object.keys(this.schema);
		return this;
	}

	if (type instanceof SchemaBuilderEntity)
		type = type.name;

	var a = this.schema[name] = this.$parse(name, type, required, custom);
	switch (this.schema[name].type) {
		case 7:
			if (this.dependencies)
				this.dependencies.push(name);
			else
				this.dependencies = [name];
			break;
	}

	this.fields = Object.keys(this.schema);

	if (a.type === 7)
		required = true;

	if (required)
		this.properties.indexOf(name) === -1 && this.properties.push(name);
	else
		this.properties = this.properties.remove(name);

	return function(val) {
		a.def = val;
		return this;
	};
};

SchemaBuilderEntityProto.verify = function(name, fn, cache) {
	var self = this;

	if (!self.verifications)
		self.verifications = [];

	var cachekey;

	if (cache)
		cachekey = self.name + '_verify_' + name + '_';

	self.verifications.push({ name: name, fn: fn, cache: cache, cachekey: cachekey });
	return self;
};

SchemaBuilderEntityProto.inherit = function(name) {

	var self = this;

	GETSCHEMA(name, function(err, schema) {

		if (err)
			throw err;

		self.primary = schema.primary;
		self.inherits.push(schema);

		if (!self.resourceName && schema.resourceName)
			self.resourceName = schema.resourceName;

		if (!self.resourcePrefix && schema.resourcePrefix)
			self.resourcePrefix = schema.resourcePrefix;

		copy_inherit(self, 'schema', schema.schema);
		copy_inherit(self, 'meta', schema.meta);
		copy_inherit(self, 'tasks', schema.tasks);
		copy_inherit(self, 'workflows', schema.workflows);

		if (schema.middlewares) {
			self.middlewares = [];
			for (var i = 0; i < schema.middlewares.length; i++)
				self.middlewares.push(schema.middlewares[i]);
		}

		if (schema.verifications) {
			self.verifications = [];
			for (var i = 0; i < schema.verifications.length; i++)
				self.verifications.push(schema.verifications[i]);
		}

		schema.properties.forEach(function(item) {
			if (self.properties.indexOf(item) === -1)
				self.properties.push(item);
		});

		if (schema.preparation) {
			self.preparation = {};
			Object.keys(schema.preparation).forEach(function(key) {
				self.preparation[key] = schema.preparation[key];
			});
		}

		if (!self.onSave && schema.onSave)
			self.onSave = schema.onSave;

		if (!self.onInsert && schema.onInsert)
			self.onInsert = schema.onInsert;

		if (!self.onUpdate && schema.onUpdate)
			self.onUpdate = schema.onUpdate;

		if (!self.onRead && schema.onRead)
			self.onRead = schema.onRead;

		if (!self.onRemove && schema.onRemove)
			self.onRemove = schema.onRemove;

		if (!self.onQuery && schema.onQuery)
			self.onQuery = schema.onQuery;

		if (!self.onError && schema.onError)
			self.onError = schema.onError;

		self.fields = Object.keys(self.schema);
	});

	return self;
};

function copy_inherit(schema, field, value) {

	if (!value)
		return;

	if (value && !schema[field]) {
		schema[field] = framework_utils.clone(value);
		return;
	}

	Object.keys(value).forEach(function(key) {
		if (schema[field][key] === undefined)
			schema[field][key] = framework_utils.clone(value[key]);
	});
}

/**
 * Set primary key
 * @param {String} name
 */
SchemaBuilderEntityProto.setPrimary = function(name) {
	this.primary = name;
	return this;
};

function parseLength(lower, result) {
	result.raw = 'string';
	var beg = lower.indexOf('(');
	if (beg !== -1) {
		result.length = lower.substring(beg + 1, lower.length - 1).parseInt();
		result.raw = lower.substring(0, beg);
	}
	return result;
}

SchemaBuilderEntityProto.$parse = function(name, value, required, custom) {

	var type = typeof(value);
	var result = {};

	result.raw = value;
	result.type = 0;
	result.length = 0;
	result.required = required ? true : false;
	result.validate = typeof(required) === 'function' ? required : null;
	result.can = null;
	result.isArray = false;
	result.custom = custom || '';

	//  0 = undefined
	//  1 = integer
	//  2 = float
	//  3 = string
	//  4 = boolean
	//  5 = date
	//  6 = object
	//  7 = custom object
	//  8 = enum
	//  9 = keyvalue
	// 10 = custom object type
	// 11 = number2
	// 12 = object as filter

	if (value === null)
		return result;

	if (value === '[]') {
		result.isArray = true;
		return result;
	}

	if (type === 'function') {

		if (value === UID || value === UID16) {
			result.type = 3;
			result.length = 20;
			result.raw = 'string';
			result.subtype = 'uid';
			return result;
		}

		if (value === Number) {
			result.type = 2;
			return result;
		}

		if (value === String) {
			result.type = 3;
			return result;
		}

		if (value === Boolean) {
			result.type = 4;
			return result;
		}

		if (value === Date) {
			result.type = 5;
			return result;
		}

		if (value === Array) {
			result.isArray = true;
			return result;
		}

		if (value === Object) {
			result.type = 6;
			return result;
		}

		if (value instanceof SchemaBuilderEntity)
			result.type = 7;
		else {
			result.type = 10;
			if (!this.asyncfields)
				this.asyncfields = [];
			this.asyncfields.push(name);
		}

		return result;
	}

	if (type === 'object') {
		if (value instanceof Array) {
			result.type = 8; // enum
			result.subtype = typeof(value[0]);
		} else
			result.type = 9; // keyvalue
		return result;
	}

	if (value[0] === '[') {
		value = value.substring(1, value.length - 1);
		result.isArray = true;
		result.raw = value;
	}

	var lower = value.toLowerCase();

	if (lower === 'object') {
		result.type = 6;
		return result;
	}

	if (lower === 'array') {
		result.isArray = true;
		return result;
	}

	if (value.indexOf(':') !== -1 || value.indexOf(',') !== -1) {
		// multiple
		result.type = 12;
		return result;
	}

	if ((/^(string|text)+(\(\d+\))?$/).test(lower)) {
		result.type = 3;
		return parseLength(lower, result);
	}

	if ((/^(name)+(\(\d+\))?$/).test(lower)) {
		result.type = 3;
		result.subtype = 'name';
		return parseLength(lower, result);
	}

	if ((/^(capitalize2)+(\(\d+\))?$/).test(lower)) {
		result.type = 3;
		result.subtype = 'capitalize2';
		return parseLength(lower, result);
	}

	if ((/^(capitalize|camelcase|camelize)+(\(\d+\))?$/).test(lower)) {
		result.type = 3;
		result.subtype = 'capitalize';
		return parseLength(lower, result);
	}

	if ((/^(lower|lowercase)+(\(\d+\))?$/).test(lower)) {
		result.subtype = 'lowercase';
		result.type = 3;
		return parseLength(lower, result);
	}

	if (lower.indexOf('base64') !== -1) {
		result.type = 3;
		result.raw = 'string';
		result.subtype = 'base64';
		return result;
	}

	if ((/^(upper|uppercase)+(\(\d+\))?$/).test(lower)) {
		result.subtype = 'uppercase';
		result.type = 3;
		return parseLength(lower, result);
	}

	if (lower === 'uid') {
		result.type = 3;
		result.length = 20;
		result.raw = 'string';
		result.subtype = 'uid';
		return result;
	}

	if (lower === 'email') {
		result.type = 3;
		result.length = 120;
		result.raw = 'string';
		result.subtype = 'email';
		return result;
	}

	if (lower === 'json') {
		result.type = 3;
		result.raw = 'string';
		result.subtype = 'json';
		return result;
	}

	if (lower === 'url') {
		result.type = 3;
		result.length = 500;
		result.raw = 'string';
		result.subtype = 'url';
		return result;
	}

	if (lower === 'zip') {
		result.type = 3;
		result.length = 10;
		result.raw = 'string';
		result.subtype = 'zip';
		return result;
	}

	if (lower === 'phone') {
		result.type = 3;
		result.length = 20;
		result.raw = 'string';
		result.subtype = 'phone';
		return result;
	}

	if (lower === 'number2') {
		result.type = 11;
		return result;
	}

	if (['int', 'integer', 'byte'].indexOf(lower) !== -1) {
		result.type = 1;
		return result;
	}

	if (['decimal', 'number', 'float', 'double'].indexOf(lower) !== -1) {
		result.type = 2;
		return result;
	}

	if (['bool', 'boolean'].indexOf(lower) !== -1) {
		result.type = 4;
		return result;
	}

	if (['date', 'time', 'datetime'].indexOf(lower) !== -1) {
		result.type = 5;
		return result;
	}

	result.type = 7;
	return result;
};

SchemaBuilderEntityProto.setPrefix = function(prefix) {
	this.resourcePrefix = prefix;
	return this;
};

SchemaBuilderEntityProto.setResource = function(name) {
	this.resourceName = name;
	return this;
};

/**
 * Set save handler
 * @param {Function(error, model, helper, next(value), controller)} fn
 * @return {SchemaBuilderEntity}
 */
SchemaBuilderEntityProto.setSave = function(fn, filter) {
	this.onSave = fn;
	this.meta.save = 1;
	this.meta.savefilter = filter;
	return this;
};

SchemaBuilderEntityProto.setSaveExtension = function(fn) {
	var key = 'save';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

/**
 * Set insert handler
 * @param {Function(error, model, helper, next(value), controller)} fn
 * @return {SchemaBuilderEntity}
 */
SchemaBuilderEntityProto.setInsert = function(fn, filter) {
	this.onInsert = fn;
	this.meta.insert = 1;
	this.meta.insertfilter = filter;
	return this;
};

SchemaBuilderEntityProto.setInsertExtension = function(fn) {
	var key = 'insert';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.setUpdate = function(fn, filter) {
	this.onUpdate = fn;
	this.meta.update = 1;
	this.meta.updatefilter = filter;
	return this;
};

SchemaBuilderEntityProto.setUpdateExtension = function(fn) {
	var key = 'update';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

/**
 * Set patch handler
 * @param {Function(error, model, helper, next(value), controller)} fn
 * @return {SchemaBuilderEntity}
 */
SchemaBuilderEntityProto.setPatch = function(fn, filter) {
	this.onPatch = fn;
	this.meta.patch = 1;
	this.meta.patchfilter = filter;
	return this;
};

SchemaBuilderEntityProto.setPatchExtension = function(fn) {
	var key = 'patch';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.setError = function(fn) {
	this.onError = fn;
	return this;
};

SchemaBuilderEntityProto.setGet = SchemaBuilderEntityProto.setRead = function(fn, filter) {
	this.onRead = fn;
	this.meta.read = this.meta.read = 1;
	this.meta.readfilter = this.meta.readfilter = filter;
	return this;
};

SchemaBuilderEntityProto.setGetExtension = SchemaBuilderEntityProto.setReadExtension = function(fn) {
	var key = 'read';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.setQuery = function(fn, filter) {
	this.onQuery = fn;
	this.meta.query = 1;
	this.meta.queryfilter = filter;
	return this;
};

SchemaBuilderEntityProto.setQueryExtension = function(fn) {
	var key = 'query';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.setRemove = function(fn, filter) {
	this.onRemove = fn;
	this.meta.remove = 1;
	this.meta.removefilter = filter;
	return this;
};

SchemaBuilderEntityProto.setRemoveExtension = function(fn) {
	var key = 'remove';
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.addTask = function(name, task, filter) {

	var self = this;

	var fn = function($) {
		$.schema = self.name;
		TASK(task, $.callback, $).value = $.model;
	};

	!self.tasks && (self.tasks = {});
	self.tasks[name] = fn;
	self.meta['task_' + name] = 1;
	self.meta['taskfilter_' + name] = filter;
	return self;
};

SchemaBuilderEntityProto.addOperation = function(name, opname, filter) {

	var self = this;

	var fn = function($) {
		$.schema = self.name;
		OPERATION(opname, $.model, $.callback, self.name, $);
	};

	!self.operations && (self.operations = {});
	self.operations[name] = fn;
	self.meta['operation_' + name] = 1;
	self.meta['operationfilter_' + name] = filter;
	return self;
};

SchemaBuilderEntityProto.addWorkflow = function(name, fn, filter) {
	!this.workflows && (this.workflows = {});
	this.workflows[name] = fn;
	this.meta['workflow_' + name] = 1;
	this.meta['workflowfilter_' + name] = filter;
	return this;
};

SchemaBuilderEntityProto.addWorkflowExtension = function(name, fn) {
	var key = 'workflow.' + name;
	if (this.extensions[key])
		this.extensions[key].push(fn);
	else
		this.extensions[key] = [fn];
	return this;
};

SchemaBuilderEntityProto.find = function(name) {
	return this.parent.get(name);
};

SchemaBuilderEntityProto.destroy = function() {
	delete this.properties;
	delete this.schema;
	delete this.onSave;
	delete this.onInsert;
	delete this.onUpdate;
	delete this.onRead;
	delete this.onRead;
	delete this.onRemove;
	delete this.onQuery;
	delete this.workflows;
	delete this.operations;
	delete this.tasks;
	delete this.meta;
	delete this.properties;
	delete this.onError;
	delete this.dependencies;
	delete this.fields;
	delete this.fields_allow;
};

SchemaBuilderEntityProto.save = function(model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('save', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.insert = function(model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('insert', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.update = function(model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('update', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.patch = function(model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('patch', name, model, opt, controller, callback, noprepare);
	return self;
};

/**
 * Execute onGet delegate
 * @param {Object} options Custom options object, optional
 * @param {Function(err, result)} callback
 * @return {SchemaBuilderEntity}
 */
SchemaBuilderEntityProto.get = SchemaBuilderEntityProto.read = function(opt, callback, controller) {

	if (typeof(opt) === 'function') {
		controller = callback;
		callback = opt;
		opt = undefined;
	}

	var self = this;
	self.exec('read', null, null, opt, controller, callback, true);
	return self;
};

SchemaBuilderEntityProto.remove = function(opt, callback, controller) {

	if (typeof(opt) === 'function') {
		controller = callback;
		callback = opt;
		opt = undefined;
	}

	var self = this;
	self.exec('remove', null, null, opt, controller, callback, true);
	return self;
};

SchemaBuilderEntityProto.query = function(opt, callback, controller) {

	var self = this;

	if (typeof(opt) === 'function') {
		controller = callback;
		callback = opt;
		opt = null;
	}

	self.exec('query', null, null, opt, controller, callback, true);
	return self;
};

SchemaBuilderEntityProto.validate = function(model, resourcePrefix, resourceName, $, path, index) {

	var self = this;
	var builder = $ ? $.error : null;

	if (!builder) {
		builder = new ErrorBuilder();
		self.resourceName && builder.setResource(self.resourceName);
		self.resourcePrefix && builder.setPrefix(self.resourcePrefix);
	}

	if (self.resourcePrefix)
		builder.resourcePrefix = self.resourcePrefix;

	if (self.resourceName)
		builder.resourceName = self.resourceName;

	if (resourceName)
		builder.resourceName = resourceName;

	if (resourcePrefix)
		builder.resourcePrefix = resourcePrefix;

	if (path)
		path += '.';
	else
		path = '';

	framework_utils.validate_builder.call(self, model, builder, self, '', index, $, path);
	return builder;
};

SchemaBuilderEntityProto.create = function() {
	return this.default();
};

SchemaBuilderEntityProto.$make = function(obj) {
	return obj;
};

function preparecallback(err, model, arg) {
	arg(err, model);
}

SchemaBuilderEntityProto.$prepare = function(obj, callback, $) {
	this.make(obj, preparecallback, callback, null, $);
};

SchemaBuilderEntityProto.default = function() {

	var obj = this.schema;
	if (obj === null)
		return null;

	var item = new SchemaValue();

	for (var property in obj) {

		var type = obj[property];
		if (type.def !== undefined) {
			item[property] = typeof(type.def) === 'function' ? type.def() : type.def;
			continue;
		}

		switch (type.type) {
			// undefined
			// object
			// object: convertor
			case 0:
			case 6:
			case 12:
				item[property] = type.isArray ? [] : null;
				break;
			// numbers: integer, float
			case 1:
			case 2:
				item[property] = type.isArray ? [] : 0;
				break;
			// numbers: default "null"
			case 10:
				item[property] = type.isArray ? [] : null;
				break;
			// string
			case 3:
				item[property] = type.isArray ? [] : type.subtype === 'email' ? '@' : '';
				break;
			// boolean
			case 4:
				item[property] = type.isArray ? [] : false;
				break;
			// date
			case 5:
				item[property] = type.isArray ? [] : NOW;
				break;
			// schema
			case 7:

				if (type.isArray) {
					item[property] = [];
				} else {
					var tmp = GETSCHEMA(type.raw);
					if (tmp) {
						item[property] = tmp.default();
					} else {
						F.error(new Error('Schema: "' + property + '.' + type.raw + '" not found.'));
						item[property] = null;
					}
				}
				break;

			// enum + keyvalue
			case 8:
			case 9:
				item[property] = undefined;
				break;
		}
	}

	return item;
};

function SchemaOptionsVerify(controller, builder) {
	var t = this;
	t.controller = (controller instanceof SchemaOptions || controller instanceof OperationOptions) ? controller.controller : controller;
	t.callback = t.next = t.success = function(value) {
		if (value !== undefined)
			t.model[t.name] = value;
		t.cache && CACHE(t.cachekey, { value: t.model[t.name] }, t.cache);
		t.$next();
	};
	t.invalid = function(err) {
		if (err) {
			builder.push(err);
			t.cache && CACHE(t.cachekey, { error: err }, t.cache);
		}
		t.model[t.name] = null;
		t.$next();
	};
}

SchemaOptionsVerify.prototype = {

	get user() {
		return this.controller ? this.controller.req.user : null;
	},

	get session() {
		return this.controller ? this.controller.session : null;
	},

	get sessionid() {
		return this.controller && this.controller ? this.controller.req.sessionid : null;
	},

	get url() {
		return (this.controller ? this.controller.req.url : '') || '';
	},

	get language() {
		return (this.controller ? this.controller.language : '') || '';
	},

	get ip() {
		return this.controller ? this.controller.req.ip : null;
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
		return this.controller ? this.controller.req.files : null;
	},

	get body() {
		return this.controller ? this.controller.req.body : null;
	},

	get query() {
		return this.controller ? this.controller.req.query : null;
	},

	get mobile() {
		return this.controller ? this.controller.req.mobile : null;
	},

	get headers() {
		return this.controller ? this.controller.req.headers : null;
	},

	get ua() {
		return this.controller ? this.controller.req.ua : null;
	}
};

SchemaBuilderEntityProto.make = function(model, callback, arg, novalidate, $) {

	var self = this;
	var verifications = [];
	var output = self.prepare(model, null, $, verifications);

	if (novalidate) {
		callback && callback(null, output, arg);
		return output;
	}

	var builder = self.validate(output, null, null, $);
	if (builder.is) {
		self.onError && self.onError(builder, model, 'make');
		callback && callback(builder, null, arg);
		return output;
	} else {

		if (self.verifications)
			verifications.unshift({ model: output, entity: self });

		if (!verifications.length) {
			callback && callback(null, output, arg);
			return output;
		}

		var options = new SchemaOptionsVerify($, builder);

		verifications.wait(function(item, next) {

			item.entity.verifications.wait(function(verify, resume) {

				options.value = item.model[verify.name];

				// Empty values are skipped
				if (options.value == null || options.value === '') {
					resume();
					return;
				}

				var cachekey = verify.cachekey;

				if (cachekey) {
					cachekey += options.value + '';
					var cachevalue = F.cache.get2(cachekey);
					if (cachevalue) {
						if (cachevalue.error)
							builder.push(cachevalue.error);
						else
							item.model[verify.name] = cachevalue.value;
						resume();
						return;
					}
				}

				options.keys = $.keys;
				options.cache = verify.cache;
				options.cachekey = cachekey;
				options.entity = item.entity;
				options.model = item.model;
				options.name = verify.name;
				options.$next = resume;
				verify.fn(options);

			}, next, 3); // "3" means count of imaginary "threads" - we will see how it will work

		}, function() {
			if (builder.is) {
				self.onError && self.onError(builder, model, 'make');
				callback && callback(builder, null, arg);
			} else
				callback && callback(null, output, arg);
		});

	}
};

SchemaBuilderEntityProto.load = SchemaBuilderEntityProto.make; // Because JSDoc doesn't work with double asserting

function autotrim(context, value) {
	return context.trim ? value.trim() : value;
}

SchemaBuilderEntityProto.$onprepare = function(name, value, index, model, $) {
	var val = value;
	if (this.preparation && this.preparation[name])
		val = this.preparation[name](val, model, index, $);
	return val === undefined ? value : val;
};

function toName(val) {

	var a = '';
	var p = 0;
	var space = false;

	for (var i = 0; i < val.length; i++) {
		var c = val.charCodeAt(i);
		if ((c < 65 || (c > 90 && c < 97) || (c > 122 && c < 128)) && c !== 32)
			continue;

		if (a && p !== 32) {

			if (c === 32) {
				p = c;
				space = true;
				continue;
			}

			if (space) {
				a += ' ';
				space = false;
			}

			a += val[i];

		} else {

			if (space) {
				a += ' ';
				space = false;
			}

			a += val[i].toUpperCase();
		}

		p = c;
	}

	return a;
}

/**
 * Prepare model according to schema
 * @param {Object} model
 * @param {String|Array} [dependencies] INTERNAL.
 * @return {SchemaValue}
 */
SchemaBuilderEntityProto.prepare = function(model, dependencies, $, verifications) {

	var self = this;
	var obj = self.schema;

	if (obj === null)
		return null;

	if (model == null || model === EMPTYOBJECT)
		return self.default();

	var tmp;
	var entity;
	var item = new SchemaValue();
	var keys = $ && $.keys ? [] : null;

	for (var property in obj) {

		var val = model[property];

		if ($ && $.keys && val === undefined) {
			delete item[property];
			continue;
		}

		var type = obj[property];
		keys && keys.push(property);

		// IS PROTOTYPE? The problem was in e.g. "search" property, because search is in String prototypes.
		if (!hasOwnProperty.call(model, property))
			val = undefined;

		var def = type.def && typeof(type.def) === 'function';

		if (val === undefined) {
			if (type.def !== undefined)
				val = def ? type.def() : type.def;
		}

		if (val === undefined)
			val = '';

		var typeval = typeof(val);

		if (typeval === 'function')
			val = val();

		if (!type.isArray) {

			switch (type.type) {
				// undefined
				case 0:
					break;
				// number: integer
				case 1:
					item[property] = self.$onprepare(property, framework_utils.parseInt(val, def ? type.def() : type.def), undefined, model, $);
					break;
				// number: float
				case 2:
					item[property] = self.$onprepare(property, framework_utils.parseFloat(val, def ? type.def() : type.def), undefined, model, $);
					break;

				// string
				case 3:

					var tv = typeof(val);

					if (val == null || tv === 'object')
						tmp = '';
					else if (tv === 'string')
						tmp = autotrim(self, val);
					else
						tmp = autotrim(self, val.toString());

					if (type.length && type.length < tmp.length)
						tmp = tmp.substring(0, type.length);

					switch (type.subtype) {
						case 'uid':
							if (tmp && !type.required && !tmp.isUID())
								tmp = '';
							break;
						case 'email':
							tmp = tmp.toLowerCase().replace(REGEXP_CLEAN_EMAIL, '');
							if (tmp && !type.required && !tmp.isEmail())
								tmp = '';
							break;
						case 'url':
							if (tmp && !type.required && !tmp.isURL())
								tmp = '';
							break;
						case 'zip':
							tmp = tmp.replace(REGEXP_CLEAN_EMAIL, '');
							if (tmp && !type.required && !tmp.isZIP())
								tmp = '';
							break;
						case 'phone':
							tmp = tmp.replace(REGEXP_CLEAN_PHONE, '');
							if (tmp && !type.required && !tmp.isPhone())
								tmp = '';
							break;
						case 'capitalize':
							tmp = tmp.capitalize();
							break;
						case 'capitalize2':
							tmp = tmp.capitalize(true);
							break;
						case 'name':
							tmp = toName(tmp);
							break;
						case 'lowercase':
							tmp = tmp.toLowerCase();
							break;
						case 'uppercase':
							tmp = tmp.toUpperCase();
							break;
						case 'json':
							if (tmp && !type.required && !tmp.isJSON())
								tmp = '';
							break;
						case 'base64':
							if (tmp && !type.required && !tmp.isBase64())
								tmp = '';
							break;
					}

					if (!tmp && type.def !== undefined)
						tmp = def ? type.def() : type.def;

					item[property] = self.$onprepare(property, tmp, undefined, model, $);
					break;

				// boolean
				case 4:
					tmp = val ? val.toString().toLowerCase() : null;
					if (type.def && (tmp == null || tmp === ''))
						tmp = def ? type.def() : type.def;
					item[property] = self.$onprepare(property, typeof(tmp) === 'string' ? !!BOOL[tmp] : tmp == null ? false : tmp, undefined, model, $);
					break;

				// date
				case 5:

					tmp = null;

					if (typeval === 'string') {
						if (val)
							tmp = val.trim().parseDate();
					} else if (typeval === 'number')
						tmp = new Date(val);
					else
						tmp = val;

					if (tmp instanceof Date && tmp.getTime() > 0)
						tmp = self.$onprepare(property, tmp, undefined, model, $);
					else {
						if (type.def !== undefined)
							tmp = def ? type.def() : type.def;
						else
							tmp = null;
					}

					item[property] = tmp;
					break;

				// object
				case 6:
					item[property] = self.$onprepare(property, val, undefined, model, $);
					if (item[property] === undefined)
						item[property] = null;
					break;

				// enum
				case 8:
					tmp = self.$onprepare(property, val, undefined, model, $);
					if (type.subtype === 'number' && typeof(tmp) === 'string')
						tmp = tmp.parseFloat(null);
					item[property] = tmp != null && type.raw.indexOf(tmp) !== -1 ? tmp : undefined;
					if (item[property] == null && type.def)
						item[property] = type.def;
					break;

				// keyvalue
				case 9:
					tmp = self.$onprepare(property, val, undefined, model, $);
					item[property] = tmp != null ? type.raw[tmp] : undefined;
					if (item[property] == null && type.def)
						item[property] = type.def;
					break;

				// schema
				case 7:

					if (!val) {
						val = (type.def === undefined ? null : (def ? type.def() : type.def));
						if (val === null) {
							item[property] = null;
							break;
						}
					}

					if (val && typeof(val.$schema) === 'function') {
						tmp = val.$schema();
						if (tmp && tmp.name && tmp.name === type.raw) {
							item[property] = val;
							break;
						}
					}

					entity = GETSCHEMA(type.raw);
					if (entity) {

						item[property] = entity.prepare(val, undefined, $, verifications);

						if (entity.verifications)
							verifications.push({ model: item[property], entity: entity });

						dependencies && dependencies.push({ name: type.raw, value: self.$onprepare(property, item[property], undefined, model, $) });

					} else
						item[property] = null;

					break;

				case 10:
					item[property] = type.raw(val == null ? '' : val.toString());
					if (item[property] === undefined)
						item[property] = null;
					break;

				// number: nullable
				case 11:
					item[property] = self.$onprepare(property, typeval === 'number' ? val : typeval === 'string' ? parseNumber(val) : null, undefined, model, $);
					break;

				// object: convertor
				case 12:
					item[property] = self.$onprepare(property, val && typeval === 'object' && !(val instanceof Array) ? CONVERT(val, type.raw) : null, undefined, model, $);
					break;

			}
			continue;
		}

		// ARRAY:
		if (!(val instanceof Array)) {
			item[property] = (type.def === undefined ? [] : (def ? type.def() : type.def));
			continue;
		}

		item[property] = [];
		for (var j = 0, sublength = val.length; j < sublength; j++) {

			// tmp = model[property][j];
			tmp = val[j];
			typeval = typeof(tmp);

			switch (type.type) {
				case 0:
					tmp = self.$onprepare(property, tmp, j, model, $);
					break;

				case 1:
					tmp = self.$onprepare(property, framework_utils.parseInt(tmp), j, model, $);
					break;

				case 2:
					tmp = self.$onprepare(property, framework_utils.parseFloat(tmp), j, model, $);
					break;

				case 3:

					tmp = tmp == null ? '' : autotrim(self, tmp.toString());
					if (type.length && tmp.length < tmp.length)
						tmp = tmp.substring(0, type.length);

					switch (type.subtype) {
						case 'uid':
							if (tmp && !type.required && !tmp.isUID())
								continue;
							break;
						case 'url':
							if (tmp && !type.required && !tmp.isURL())
								continue;
							break;
						case 'email':
							tmp = tmp.toLowerCase().replace(REGEXP_CLEAN_EMAIL, '');
							if (tmp && !type.required && !tmp.isEmail())
								continue;
							break;
						case 'phone':
							tmp = tmp.replace(REGEXP_CLEAN_PHONE, '');
							if (tmp && !type.required && !tmp.isPhone())
								continue;
							break;
						case 'name':
							tmp = toName(tmp);
							break;
						case 'capitalize':
							tmp = tmp.capitalize();
							break;
						case 'capitalize2':
							tmp = tmp.capitalize(true);
							break;
						case 'lowercase':
							tmp = tmp.toLowerCase();
							break;
						case 'uppercase':
							tmp = tmp.toUpperCase();
							break;
						case 'json':
							if (tmp && !type.required && !tmp.isJSON())
								continue;
							break;
						case 'base64':
							if (tmp && !type.required && !tmp.isBase64())
								continue;
							break;
					}

					tmp = self.$onprepare(property, tmp, j, model, $);
					break;

				case 4:
					if (tmp)
						tmp = tmp.toString().toLowerCase();
					tmp = self.$onprepare(property, BOOL[tmp], j, model, $);
					break;

				case 5:

					if (typeval === 'string') {
						if (tmp)
							tmp = tmp.trim().parseDate();
					} else if (typeval === 'number')
						tmp = new Date(tmp);

					if (tmp instanceof Date && tmp.getTime() > 0)
						tmp = self.$onprepare(property, tmp, j, model, $);
					else
						tmp = undefined;

					break;

				case 6:
					tmp = self.$onprepare(property, tmp, j, model, $);
					break;

				case 7:

					entity = GETSCHEMA(type.raw);

					if (entity) {
						tmp = entity.prepare(tmp, dependencies, $, verifications);
						dependencies && dependencies.push({ name: type.raw, value: self.$onprepare(property, tmp, j, model, $) });
					} else
						throw new Error('Schema "{0}" not found'.format(type.raw));

					tmp = self.$onprepare(property, tmp, j, model, $);

					if (entity.verifications && tmp)
						verifications.push({ model: tmp, entity: entity });

					break;

				case 11:
					tmp = self.$onprepare(property, typeval === 'number' ? tmp : typeval === 'string' ? parseNumber(tmp) : null, j, model, $);
					if (tmp == null)
						continue;
					break;

				case 12:
					tmp = self.$onprepare(property, tmp ? CONVERT(tmp, type.raw) : null, j, model, $);
					if (tmp == null)
						continue;
					break;
			}

			if (tmp !== undefined)
				item[property].push(tmp);
		}
	}

	if (self.fields_allow) {
		for (var i = 0, length = self.fields_allow.length; i < length; i++) {
			var name = self.fields_allow[i];
			var val = model[name];
			if (val !== undefined) {
				item[name] = val;
				keys && keys.push(name);
			}
		}
	}

	if (keys && !keys.length)
		$.empty = true;

	return item;
};

function parseNumber(str) {
	if (!str)
		return null;
	if (str.indexOf(',') !== -1)
		str = str.replace(',', '.');
	var num = +str;
	return isNaN(num) ? null : num;
}

SchemaBuilderEntityProto.$process = function(arg, model, type, name, builder, response, callback) {

	var self = this;

	if (arg.length > 1 || (response instanceof Error || response instanceof ErrorBuilder)) {
		if ((response instanceof Error || response instanceof ErrorBuilder || typeof(response) === 'string') && builder !== response)
			builder.push(response);
		response = arg[1];
	}

	var has = builder.is;
	has && self.onError && self.onError(builder, model, type, name);

	if (callback) {
		if (response !== NoOp)
			callback(has ? builder : null, response === undefined ? model : response, model);
		else
			callback = null;
	}

	return self;
};

SchemaBuilderEntityProto.operation = function(name, model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('operation', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.operation2 = function(name, opt, callback, controller) {
	var self = this;
	self.operation(name, null, opt, callback, controller, true);
	return self;
};

SchemaBuilderEntityProto.task = function(name, model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('task', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.task2 = function(name, opt, callback, controller) {
	var self = this;
	self.task(name, null, opt, callback, controller, true);
	return self;
};

SchemaBuilderEntityProto.workflow = function(name, model, opt, callback, controller, noprepare) {

	if (typeof(opt) === 'function') {
		noprepare = controller;
		controller = callback;
		callback = opt;
		opt = null;
	}

	var self = this;
	self.exec('workflow', name, model, opt, controller, callback, noprepare);
	return self;
};

SchemaBuilderEntityProto.workflow2 = function(name, opt, callback, controller) {
	var self = this;
	self.exec('workflow', name, null, opt, controller, callback, true);
	return self;
};

SchemaBuilderEntityProto.exec = function(type, name, model, options, controller, callback, noprepare) {

	var error = new ErrorBuilder();
	var self = this;

	self.resourceName && error.setResource(self.resourceName);
	self.resourcePrefix && error.setPrefix(self.resourcePrefix);

	var key = type + (name ? ('.' + name) : '');
	var now;

	if (CONF.logger)
		now = Date.now();

	var $ = new SchemaOptions(error, model, options, function(response) {
		CONF.logger && F.ilogger(self.getLoggerName(type, name), $.controller, now);
		self.$process(arguments, $.model, type, name, error, response, callback);
	}, controller, key, self);

	$.ID = self.name + '.' + (name ? name : type);
	$.type = type;

	if (controller && controller.req && controller.req.keys)
		$.keys = controller.req.keys;
	else
		$.keys = null;

	self.perform(type, name, $, noprepare);
};

SchemaBuilderEntityProto.perform = function(type, name, $, noprepare, nomiddleware) {

	var self = this;
	var ntype;

	switch (type) {
		case 'workflow':
		case 'task':
		case 'operation':
			ntype = type + 's';
			break;
		case 'Save':
		case 'save':
			ntype = 'onSave';
			break;
		case 'Read':
		case 'read':
		case 'Get':
		case 'get':
			ntype = 'onRead';
			break;
		case 'Remove':
		case 'remove':
			ntype = 'onRemove';
			break;
		case 'Patch':
		case 'patch':
			ntype = 'onPatch';
			break;
		case 'Insert':
		case 'insert':
			ntype = 'onInsert';
			break;
		case 'Update':
		case 'update':
			ntype = 'onUpdate';
			break;
		case 'Query':
		case 'query':
			ntype = 'onQuery';
			break;
	}

	var ref = self[ntype];
	var item = ref ? (name ? ref[name] : ref) : undefined;

	if (!item) {
		type = type.capitalize();
		$.invalid('Schema "' + self.name + '" doesn\'t contain "' + type + (name ? ('.' + name) : '') + '" operation.');
		return self;
	}

	var opfilter = self.meta[type + 'filter' + (name ? ('_' + name) : '')];
	if (opfilter && $.controller) {
		$.controller.$filterschema = opfilter;
		$.controller.$filter = null;
	}

	if (!$.model)
		$.model = {};

	if (noprepare) {
		if (nomiddleware || !self.middlewares || !self.middlewares.length)
			item.call(self, $, $.model);
		else
			runmiddleware($, self, item);
		return self;
	}

	self.$prepare($.model, function(err, model) {

		if (err) {
			$.invalid(err);
			return;
		}

		$.model = model;
		if (nomiddleware || !self.middlewares || !self.middlewares.length)
			item.call(self, $, $.model);
		else
			runmiddleware($, self, item);
	}, $);

	return self;
};

SchemaBuilderEntityProto.async = function(model, callback, index, controller) {

	var self = this;
	var error = new ErrorBuilder();

	var a = {};
	a.index = index;
	a.indexer = -1;
	a.controller = controller;
	a.tasks = [];
	a.op = [];
	a.pending = 0;
	a.type = '';

	if (CONF.logger)
		a.now = Date.now();

	self.resourceName && error.setResource(self.resourceName);
	self.resourcePrefix && error.setPrefix(self.resourcePrefix);

	var error = new ErrorBuilder();

	var $ = new SchemaOptions(error, model, null, function(response) {
		if (!$.initialized)
			$.initialized = true;
		CONF.logger && F.ilogger(self.getLoggerName(a.type, a.name), $.controller, a.now);
		self.$process(arguments, $.model, a.type, a.name, error, response, process);
	}, controller, null, self);

	// Multiple responses
	$.$multiple = true;
	$.$async = a;

	var process = function(err, response) {
		a.pending--;
		if (err) {
			// STOP ERROR
			callback(err);
			a.tasks = null;
			a.op = null;
			a.controller = null;
			a = null;
		} else {
			var key = a.type + (a.name ? ('_' + a.name) : '');
			$.responses[key] = $.responses[a.indexer] = response;
			a.next();
		}
	};

	a.next = function() {

		a.running = true;

		var item = a.tasks.shift();
		if (item) {

			a.indexer++;
			a.pending++;

			var name = item.name;

			if (self.meta[name]) {
				a.type = name;
				name = '';
			} else if (self.meta['workflow_' + name])
				a.type = 'workflow';
			else if (self.meta['operation_' + name])
				a.type = 'operation';
			else if (self.meta['task_' + name])
				a.type = 'task';

			a.name = name;
			$.type = a.type;
			$.ID = self.name + '.' + (name ? name : a.type);
			$.name = a.type + (name ? ('.' + name) : '');
			$.options = item.options;

			var novalidate = true;

			if (!$.initialized) {
				if (!$.model || $.model === EMPTYOBJECT) {
					novalidate = true;
					$.model = {};
				} else if (model instanceof SchemaValue)
					novalidate = true;
				else
					novalidate = false;
			}

			self.perform(a.type, name, $, novalidate, $.initialized);

		} else if (!a.pending) {
			if (a.index == null) {
				var tmp = [];
				var max = a.indexer + 1;
				for (var i = 0; i < max; i++)
					tmp.push($.responses[i]);
				callback(null, tmp);
			} else
				callback(null, $.responses[a.index]);
		}
	};

	var add = function(name, options) {
		a.tasks.push({ name: name, options: options });
		return add;
	};

	if (model && model !== EMPTYOBJECT) {
		if (model instanceof SchemaValue) {
			setImmediate(a.next);
		} else {
			self.make(model, function(err, response) {
				if (err)
					callback(err);
				else {
					a.model = response;
					setImmediate(a.next);
				}
			}, null, null, model == null);
		}
	} else
		setImmediate(a.next);

	return add;
};

SchemaBuilderEntityProto.getLoggerName = function(type, name) {
	return this.id + '.' + type + (name ? ('(\'' + name + '\')') : '()');
};

/**
 * Clean model (remove state of all schemas in model).
 * @param {Object} m Model.
 * @param {Boolean} isCopied Internal argument.
 * @return {Object}
 */
SchemaBuilderEntityProto.clean = function(m) {
	return clone(m);
};

function clone(obj) {

	if (!obj)
		return obj;

	var type = typeof(obj);
	if (type !== 'object' || obj instanceof Date)
		return obj;

	var length;
	var o;

	if (obj instanceof Array) {

		length = obj.length;
		o = new Array(length);

		for (var i = 0; i < length; i++) {
			type = typeof(obj[i]);
			if (type !== 'object' || obj[i] instanceof Date) {
				if (type !== 'function')
					o[i] = obj[i];
				continue;
			}
			o[i] = clone(obj[i]);
		}

		return o;
	}

	o = {};

	for (var m in obj) {

		var val = obj[m];

		if (val instanceof Array) {
			o[m] = clone(val);
			continue;
		}

		var type = typeof(val);
		if (type !== 'object' || val instanceof Date) {
			if (type !== 'function')
				o[m] = val;
			continue;
		}

		// Because here can be a problem with MongoDB.ObjectID
		// I assume plain/simple model
		if (val && val.constructor === Object)
			o[m] = clone(obj[m]);
		else
			o[m] = val;
	}

	return o;
}

SchemaBuilderEntityProto.cl = function(name, value) {
	var o = this.schema[name];
	if (o && (o.type === 8 || o.type === 9)) {
		if (value)
			o.raw = value;
		return o.raw;
	}
};

SchemaBuilderEntityProto.props = function() {

	var self = this;
	var keys = Object.keys(self.schema);
	var prop = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var meta = self.schema[key];
		var obj = {};

		if (meta.required)
			obj.required = meta.required;

		if (meta.length)
			obj.length = meta.length;

		if (meta.isArray)
			meta.array = true;

		switch (meta.type) {
			case 1:
			case 2:
			case 11:
				obj.type = 'number';
				break;
			case 3:
				obj.type = 'string';
				switch (meta.subtype) {
					case 'uid':
						obj.type = 'uid';
						delete obj.length;
						break;
					default:
						obj.subtype = meta.subtype;
						break;
				}
				break;

			case 4:
				obj.type = 'boolean';
				break;
			case 5:
				obj.type = 'date';
				break;
			case 7:
				obj.type = 'schema';
				obj.name = meta.raw;
				break;
			case 8:
				obj.type = 'enum';
				obj.items = meta.raw;
				break;
			case 9:
				// obj.type = 'keyvalue';
				obj.type = 'enum'; // because it returns keys only
				obj.items = Object.keys(meta.raw);
				break;
			// case 6:
			// case 0:
			// case 10:
			default:
				obj.type = 'object';
				break;
		}

		prop[key] = obj;
	}

	return prop;
};

/**
 * ErrorBuilder
 * @class
 * @classdesc Object validation.
 * @param {ErrorBuilderOnResource} onResource Resource handler.
 * @property {Number} count Count of errors.
 */
function ErrorBuilder(onResource) {

	this.items = [];
	this.transformName = transforms.error_default;
	this.onResource = onResource;
	this.resourceName = CONF.default_errorbuilder_resource_name;
	this.resourcePrefix = CONF.default_errorbuilder_resource_prefix || '';
	this.isResourceCustom = false;
	this.count = 0;
	this.replacer = [];
	this.isPrepared = false;
	this.contentType = 'application/json';
	this.status = CONF.default_errorbuilder_status || 200;

	// Hidden: when the .push() contains a classic Error instance
	// this.unexpected;

	// A default path for .push()
	// this.path;

	!onResource && this._resource();
}

/**
 * @callback ErrorBuilderOnResource
 * @param {String} name Filename of resource.
 * @param {String} key Resource key.
 * @return {String}
 */

/**
 * UrlBuilder
 * @class
 * @classdesc CRUD parameters in URL.
 */
function UrlBuilder() {
	this.builder = {};
}

global.EACHSCHEMA = exports.eachschema = function(group, fn) {

	if (fn === undefined) {
		fn = group;
		group = undefined;
	}

	var keys = Object.keys(schemas);
	for (var i = 0; i < keys.length; i++) {
		var schema = schemas[keys[i]];
		fn(schema.name, schema);
	}
};

global.MAPSCHEMA = function(schema, pk) {
	return function(response) {
		var items = [];
		for (var i = 0; i < response.length; i++)
			items.push(response[i][pk || 'id']);
		var arr = schema.split(',');
		for (var i = 0; i < arr.length; i++) {
			var path = arr[i].trim().split('.');
			GETSCHEMA(path[0]).cl(path[1], items);
		}
	};
};

global.GETSCHEMA = exports.getschema = function(name, fn, timeout) {

	if (!name || typeof(name) === 'function') {
		timeout = fn;
		fn = name;
	}

	if (fn)
		WAIT(() => !!schemasall[name], err => fn(err, schemasall[name]), timeout || 20000);
	else
		return schemasall[name];
};

exports.findschema = function(groupname) {
	return schemasall[groupname.toLowerCase()];
};

exports.newschema = function(name) {
	var o = new SchemaBuilderEntity(name);
	o.owner = F.$owner();
	schemasall[name.toLowerCase()] = schemasall[name] = o;
	return o;
};

/**
 * Remove a schema
 * @param {String} group Optional
 * @param {String} name
 */
exports.remove = function(name) {
	Object.keys(schemasall).forEach(function(key) {
		if (key === name)
			delete schemasall[key];
	});
};

global.EACHOPERATION = function(fn) {
	var keys = Object.keys(operations);
	for (var i = 0, length = keys.length; i < length; i++)
		fn(keys[i]);
};

/**
 * Validate model
 * @param {String} name Schema name.
 * @param {Object} model Object for validating.
 * @return {ErrorBuilder}
 */
exports.validate = function(name, model, resourcePrefix, resourceName) {
	var schema = schemas[DEFAULT_SCHEMA];
	if (schema === undefined)
		return null;
	schema = schema.get(name);
	model = schema.prepare(model);
	return schema === undefined ? null : schema.validate(model, resourcePrefix, resourceName);
};

/**
 * Create default object according to schema
 * @param  {String} name Schema name.
 * @return {Object}
 */
exports.create = function(name) {
	return exports.defaults(name);
};

/**
 * Create default object according to schema
 * @param  {String} name Schema name.
 * @return {Object}
 */
exports.defaults = function(name) {
	if (schemas[DEFAULT_SCHEMA] === undefined)
		return null;
	var schema = schemas[DEFAULT_SCHEMA].get(name);
	return schema === undefined ? null : schema.default();
};

/**
 * Prepare object according to schema
 * @param {String} name Schema name.
 * @param {Object} model Object to prepare.
 * @return {Object} Prepared object.
 */
exports.prepare = function(name, model) {
	if (schemas[DEFAULT_SCHEMA] === undefined)
		return null;
	var schema = schemas[DEFAULT_SCHEMA].get(name);
	return schema === undefined ? null : schema.prepare(model);
};

// ======================================================
// PROTOTYPES
// ======================================================

ErrorBuilder.prototype = {

	get errors() {
		var self = this;
		!self.isPrepared && self.prepare();
		return self._transform();
	},

	get error() {
		var self = this;
		!self.isPrepared && self.prepare();
		return self._transform();
	},

	get is() {
		return this.items.length > 0;
	},

	get length() {
		return this.items.length;
	}
};

/**
 * Resource setting
 * @param {String} name Resource name.
 * @param {String} prefix Resource prefix.
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.resource = function(name, prefix) {
	var self = this;
	self.isResourceCustom = true;
	self.resourceName = name;
	self.resourcePrefix = prefix || '';
	return self._resource();
};

ErrorBuilder.prototype.setContentType = function(type) {
	this.contentType = type;
	return this;
};

ErrorBuilder.prototype.setResource = function(name) {
	var self = this;
	self.isResourceCustom = true;
	self.resourceName = name;
	return self._resource();
};

ErrorBuilder.prototype.setPrefix = function(name) {
	var self = this;
	self.resourcePrefix = name || '';
	return self._resource();
};

/**
 * Internal: Resource wrapper
 * @private
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype._resource = function() {
	var self = this;
	self.onResource = self._resource_handler;
	return self;
};

ErrorBuilder.prototype._resource_handler = function(name) {
	var self = this;
	return global.F ? RESOURCE(self.resourceName || 'default', name) : '';
};

ErrorBuilder.prototype.exception = function(message) {
	this.items.push({ name: '', error: message });
	return this;
};

/**
 * Add an error
 * @param {String} name  Property name.
 * @param {String|Error} error Error message.
 * @param {String} path  Current path (in object).
 * @param {Number} index Array Index, optional.
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.add = function(name, error, path, index) {
	return this.push(name, error, path, index);
};

const ERRORBUILDERWHITE = { ' ': 1, ':': 1, ',': 1 };

/**
 * Add an error (@alias for add)
 * @param {String} name  Property name.
 * @param {String or Error} error Error message.
 * @param {String} path  Current path (in object).
 * @param {Number} index Array Index, optional.
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.push = function(name, error, path, index, prefix) {

	this.isPrepared = false;

	if (name instanceof ErrorBuilder) {
		if (name !== this && name.is) {
			for (var i = 0; i < name.items.length; i++)
				this.items.push(name.items[i]);
			this.count = this.items.length;
		}
		return this;
	}

	if (name instanceof Array) {
		for (var i = 0; i < name.length; i++)
			this.push(name[i], undefined, path, index, prefix);
		return this;
	}

	if (error instanceof Array) {
		for (var i = 0; i < error.length; i++)
			this.push(name, error[i], path, index, prefix);
		return this;
	}


	if (typeof(name) === 'object') {
		path = error;
		error = name;
		name = '';
	}

	if (error === null || (!name && !error))
		return this;

	// Status code
	if (error > 0) {
		this.status = +error;
		error = '@';
	} else if (path > 0) {
		this.status = +path;
		path = undefined;
	}

	if (this.path && !path)
		path = this.path;

	var status;

	// e.g. push(404)
	if (name > 0) {
		status = +name;
		name = name + '';
	}

	if (!error && typeof(name) === 'string') {

		var m = name.length;
		if (m > 15)
			m = 15;

		error = '@';

		for (var i = 0; i < m; i++) {
			if (ERRORBUILDERWHITE[name[i]]) {
				error = name;
				name = '';
				break;
			}
		}
	}

	if (error instanceof Error) {
		// Why? The answer is in controller.callback(); It's a reason for throwing 500 - internal server error
		this.unexpected = true;
		error = error.toString();
	}

	this.items.push({ name: name, error: typeof(error) === 'string' ? error : error.toString(), path: path, index: index, prefix: prefix, status: status });
	this.count = this.items.length;
	return this;
};

ErrorBuilder.assign = function(arr) {
	var builder = new ErrorBuilder();
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].error)
			builder.items.push(arr[i]);
	}
	builder.count = builder.items.length;
	return builder.count ? builder : null;
};

/**
 * Remove error
 * @param {String} name Property name.
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.remove = function(name) {
	this.items = this.items.remove('name', name);
	this.count = this.items.length;
	return this;
};

/**
 * Has error?
 * @param {String}  name Property name (optional).
 * @return {Boolean}
 */
ErrorBuilder.prototype.hasError = function(name) {
	return name ? this.items.findIndex('name', name) !== -1 : this.items.length > 0;
};

/**
 * Read an error
 * @param {String} name Property name.
 * @return {String}
 */
ErrorBuilder.prototype.read = function(name) {
	!this.isPrepared && this.prepare();
	var error = this.items.findItem('name', name);
	return error ? error.error : null;
};

/**
 * Clear error collection
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.clear = function() {
	this.items = [];
	this.count = 0;
	return this;
};

/**
 * Replace text in message
 * @param {String} search Text to search.
 * @param {String} newvalue Text to replace.
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.replace = function(search, newvalue) {
	this.isPrepared = false;
	this.replacer[search] = newvalue;
	return this;
};

/**
 * Serialize ErrorBuilder to JSON
 * @param {Boolean} beautify Beautify JSON.
 * @param {Function(key, value)} replacer JSON replacer.
 * @return {String}
 */
ErrorBuilder.prototype.json = function(beautify, replacer) {
	var items = this.prepare().items;
	return beautify ? JSON.stringify(items, replacer, '\t') : JSON.stringify(items, replacer === true ? framework_utils.json2replacer : replacer);
};

ErrorBuilder.prototype.plain = function() {
	var items = this.prepare().items;
	var output = '';
	for (var i = 0; i < items.length; i++)
		output += (output ? ', ' : '') + items[i].error;
	return output;
};

/**
 * Serialize ErrorBuilder to JSON
 * @param {Boolean} beautify Beautify JSON.
 * @return {String}
 */
ErrorBuilder.prototype.JSON = function(beautify, replacer) {
	return this.json(beautify, replacer === true ? framework_utils.json2replacer : replacer);
};

/**
 * Internal: Prepare error messages with onResource()
 * @private
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype._prepare = function() {

	if (!this.onResource)
		return this;

	var arr = this.items;
	for (var i = 0; i < arr.length; i++) {

		var o = arr[i];

		if (o.error[0] !== '@')
			continue;

		if (o.error[1] === '(') {
			// auto-localize
			var err = o.error.substring(2, o.error.length - 1);
			o.error = this.onResource('T' + err.hash(true).toString(36)) || err;
		} else if (o.error.length === 1)
			o.error = this.onResource(o.prefix ? o.prefix : (this.resourcePrefix + o.name));
		else
			o.error = this.onResource(o.error.substring(1));

		if (!o.error) {
			if (o.status) {
				o.error = U.httpstatus(o.status);
				o.status = undefined;
			}
			if (!o.error)
				o.error = 'The field "' + o.name + '" is invalid';
		}
	}

	return this;
};

/**
 * Execute a transform
 * @private
 * @return {Object}
 */
ErrorBuilder.prototype._transform = function(name) {
	var transformName = name || this.transformName;
	if (transformName) {
		var current = transforms.error[transformName];
		return current ? current.call(this) : this.items;
	}
	return this.items;
};

ErrorBuilder.prototype.output = function(isresponse) {

	if (!this.transformName)
		return isresponse ? this.json() : this.items;

	var current = transforms.error[this.transformName];
	if (current) {
		this.prepare();
		return current.call(this, isresponse);
	}

	return isresponse ? this.json() : this.items;
};

/**
 * To string
 * @return {String}
 */
ErrorBuilder.prototype.toString = function() {

	!this.isPrepared && this.prepare();

	var errors = this.items;
	var length = errors.length;
	var builder = [];

	for (var i = 0; i < length; i++)
		builder.push(errors[i].error || errors[i].name);

	return builder.join('\n');

};

/**
 * Set transformation for current ErrorBuilder
 * @param {String} name
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.setTransform = function(name) {
	this.transformName = name;
	return this;
};

/**
 * Transform
 * @param {String} name
 * @return {Object}
 */
ErrorBuilder.prototype.transform = function(name) {
	return this.prepare()._transform(name);
};

/**
 * Internal: Prepare error messages with onResource()
 * @private
 * @return {ErrorBuidler}
 */
ErrorBuilder.prototype._prepareReplace = function() {

	var self = this;
	var errors = self.items;
	var lengthBuilder = errors.length;
	var keys = Object.keys(self.replacer);
	var lengthKeys = keys.length;

	if (!lengthBuilder || !lengthKeys)
		return self;

	for (var i = 0; i < lengthBuilder; i++) {
		var o = errors[i];
		for (var j = 0; j < lengthKeys; j++) {
			var key = keys[j];
			o.error = o.error.replace(key, self.replacer[key]);
		}
	}

	return self;
};

/**
 * Internal: Prepare error messages with onResource()
 * @private
 * @return {ErrorBuilder}
 */
ErrorBuilder.prototype.prepare = function() {
	if (!this.isPrepared) {
		this._prepare()._prepareReplace();
		this.isPrepared = true;
	}
	return this;
};

/**
 * STATIC: Create transformation
 * @param {String} name
 * @param {Function(ErrorBuilder)} fn
 * @param {Boolean} isDefault Default transformation for all error builders.
 */
ErrorBuilder.addTransform = function(name, fn, isDefault) {
	transforms.error[name] = fn;
	isDefault && ErrorBuilder.setDefaultTransform(name);
};

/**
 * STATIC: Remove transformation
 * @param {String} name
 */
ErrorBuilder.removeTransform = function(name) {
	delete transforms.error[name];
};

/**
 * STATIC: Create transformation
 * @param {String} name
 * @param {Function(errorBuilder)} fn
 */
ErrorBuilder.setDefaultTransform = function(name) {
	if (name)
		transforms.error_default = name;
	else
		delete transforms.error_default;
};

/**
 * Pagination
 * @class
 * @param {Number} items Count of items.
 * @param {Number} page Current page.
 * @param {Number} max Max items on page.
 * @param {String} format URL format for links (next, back, go to). Example: ?page={0} --- {0} = page, {1} = items count, {2} = page count
 * @property {Number} isNext Is next page?
 * @property {Number} isPrev Is previous page?
 * @property {Number} count Page count.
 * @property {Boolean} visible Is more than one page?
 * @property {String} format Format URL. Example: ?page={0} --- {0} = page, {1} = items count, {2} = page count
 */
function Pagination(items, page, max, format) {
	this.isNext = false;
	this.isPrev = false;
	this.isFirst = false;
	this.isLast = false;
	this.nextPage = 0;
	this.prevPage = 0;
	this.lastPage = 0;
	this.firstPage = 0;
	this.items = Math.max(0, +items);
	this.count = 0;
	this.skip = 0;
	this.take = 0;
	this.page = 0;
	this.max = 0;
	this.visible = false;
	this.format = format || '?page={0}';
	this.refresh(items, page, max);
	this.transformName = transforms.pagination_default;
}

function Page(url, page, selected, enabled) {
	this.url = url;
	this.page = page;
	this.selected = selected;
	this.enabled = enabled;
}

Page.prototype.html = function(body, cls) {
	var classname = cls ? cls : '';
	if (this.selected)
		classname += (classname ? ' ' : '') + 'selected';
	return '<a href="' + this.url + '"' + (classname ? (' class="' + classname + '"') : '') + '>' + (body || this.page) + '</a>';
};

/**
 * STATIC: Create transformation
 * @param {String} name
 * @param {Function(pagination)} fn
 * @param {Boolean} isDefault Default transformation for all paginations.
 */
Pagination.addTransform = function(name, fn, isDefault) {
	transforms.pagination[name] = fn;
	isDefault && Pagination.setDefaultTransform(name);
};

/**
 * STATIC: Create transformation
 * @param {String} name
 * @param {Function(pagination)} fn
 */
Pagination.setDefaultTransform = function(name) {
	if (name)
		transforms.pagination_default = name;
	else
		delete transforms.pagination_default;
};

/**
 * STATIC: Remove transformation
 * @param {String} name
 */
Pagination.removeTransform = function(name) {
	delete transforms.pagination[name];
};

/**
 * Refresh pagination
 * @param {Number} items Count of items.
 * @param {Number} page Current page.
 * @param {Number} max Max items on page.
 * @return {Pagination}
 */
Pagination.prototype.refresh = function(items, page, max) {

	var t = this;

	t.page = Math.max(1, +page) - 1;

	if (t.page <= 0)
		t.page = 0;

	t.items = Math.max(0, +items);
	t.max = Math.max(1, +max);
	t.skip = t.page * t.max;
	t.count = Math.ceil(t.items / t.max);
	t.take = Math.min(t.max, (t.items - t.skip));

	t.lastPage = t.count;
	t.firstPage = 1;
	t.prevPage = t.page ? t.page : 1;
	t.nextPage = t.page + 2 < t.count - 1 ? t.page + 2 : t.count;

	t.isPrev = t.page > 0;
	t.isNext = t.page < t.count - 1;

	t.isFirst = t.page === 0;
	t.isLast = t.page === t.count - 1;

	t.visible = t.count > 1;
	t.page++;

	return t;
};

/**
 * Set transformation for current Pagination
 * @param {String} name
 * @return {Pagination}
 */
Pagination.prototype.setTransform = function(name) {
	this._transform = name;
	return this;
};

/**
 * Execute a transform
 * @private
 * @param {String} name A transformation name.
 * @param {Object} argument1 Optional.
 * @param {Object} argument2 Optional.
 * @param {Object} argument3 Optional.
 * @param {Object} argument4 Optional.
 * @param {Object} argument..n Optional.
 * @return {Object}
 */
Pagination.prototype.transform = function(name) {

	var transformName = name || this.transformName;
	if (!transformName)
		throw new Error('A transformation of Pagination not found.');

	var current = transforms.pagination[transformName];
	if (!current)
		return this.render();

	var param = [];
	for (var i = 1; i < arguments.length; i++)
		param.push(arguments[i]);

	return current.apply(this, param);
};

/**
 * Get a previous page
 * @param {String} format Custom format (optional).
 * @return {Object} Example: { url: String, page: Number, selected: Boolean }
 */
Pagination.prototype.prev = function(format) {
	var page = 0;

	format = format || this.format;

	if (this.isPrev)
		page = this.page - 1;
	else
		page = this.count;

	return new Page(format.format(page, this.items, this.count), page, false, this.isPrev);
};

/**
 * Get a next page
 * @param {String} format Custom format (optional).
 * @return {Object} Example: { url: String, page: Number, selected: Boolean }
 */
Pagination.prototype.next = function(format) {
	var page = 0;

	format = format || this.format;

	if (this.isNext)
		page = this.page + 1;
	else
		page = 1;

	return new Page(format.format(page, this.items, this.count), page, false, this.isNext);
};

/**
 * Get a last page
 * @param {String} format Custom format (optional).
 * @return {Object} Example: { url: String, page: Number, selected: Boolean }
 */
Pagination.prototype.last = function(format) {
	var page = this.count;
	format = format || this.format;
	return new Page(format.format(page, this.items, this.count), page, false, this.count > 0);
};

/**
 * Get a first page
 * @param {String} format Custom format (optional).
 * @return {Object} Example: { url: String, page: Number, selected: Boolean }
 */
Pagination.prototype.first = function(format) {
	var page = 1;
	format = format || this.format;
	return new Page(format.format(page, this.items, this.count), page, false, this.count > 0);
};

/**
 * Create a pagination object
 * @param {Number} max Max pages in collection (optional).
 * @param {String} format Custom format (optional).
 * @return {Object Array} Example: [{ url: String, page: Number, selected: Boolean }]
 */
Pagination.prototype.prepare = function(max, format, type) {

	var self = this;

	if (self.transformName)
		return transforms.pagination[self.transformName].apply(self, arguments);

	var builder = [];
	format = format || self.format;

	if (typeof(max) === 'string') {
		var tmp = format;
		format = max;
		max = tmp;
	}

	var isHTML = type === 'html';

	if (max == null) {
		for (var i = 1; i < self.count + 1; i++) {
			var page = new Page(format.format(i, self.items, self.count), i, i === self.page, true);
			builder.push(isHTML ? page.html() : page);
		}
		return builder;
	}

	var half = Math.floor(max / 2);
	var pages = self.count;

	var pageFrom = self.page - half;
	var pageTo = self.page + half;
	var plus = 0;

	if (pageFrom <= 0) {
		plus = Math.abs(pageFrom);
		pageFrom = 1;
		pageTo += plus;
	}

	if (pageTo >= pages) {
		pageTo = pages;
		pageFrom = pages - max;
		if (pageFrom <= 0)
			pageFrom = 1;
	}

	for (var i = pageFrom; i < pageTo + 1; i++) {
		var page = new Page(format.format(i, self.items, self.count), i, i === self.page, true);
		builder.push(isHTML ? page.html() : page);
	}

	return builder;
};

Pagination.prototype.render = function(max, format) {
	return this.prepare(max, format);
};

Pagination.prototype.html = function(max, format) {
	return this.prepare(max, format, 'html').join('');
};

Pagination.prototype.json = function(max, format) {
	return JSON.stringify(this.prepare(max, format));
};

UrlBuilder.make = function(fn) {
	var b = new UrlBuilder();
	fn.call(b, b);
	return b;
};

/**
 * Add parameter
 * @param {String} name
 * @param {Object} value
 * return {UrlBuilder}
 */
UrlBuilder.prototype.add = function(name, value) {

	if (typeof(name) !== 'object') {
		this.builder[name] = value;
		return this;
	}

	var arr = Object.keys(name);

	for (var i = 0, length = arr.length; i < length; i++)
		this.builder[arr[i]] = name[arr[i]];

	return this;
};

/**
 * Remove parameter
 * @param {String} name
 * @return {UrlBuilder}
 */
UrlBuilder.prototype.remove = function(name) {
	delete this.builder[name];
	return this;
};

/**
 * Read value
 * @param {String} name
 * @return {Object}
 */
UrlBuilder.prototype.read = function(name) {
	return this.builder[name] || null;
};

/**
 * Clear parameter collection
 * @return {UrlBuilder}
 */
UrlBuilder.prototype.clear = function() {
	this.builder = {};
	return this;
};

/**
 * Create URL
 * @return {String}
 */
UrlBuilder.prototype.toString = function(url, skipEmpty) {

	if (typeof(url) === 'boolean') {
		var tmp = skipEmpty;
		skipEmpty = url;
		url = tmp;
	}

	var self = this;
	var builder = [];

	Object.keys(self.builder).forEach(function(o) {

		var value = self.builder[o];
		if (value == null)
			value = '';
		else
			value = value.toString();

		if (skipEmpty && value === '')
			return;

		builder.push(o + '=' + encodeURIComponent(value));
	});

	if (typeof(url) === 'string') {
		if (url[url.length - 1] !== '?')
			url += '?';
	} else
		url = '';

	return url + builder.join('&');
};

/**
 * Has these parameters?
 * @param {String Array} keys Keys.
 * @return {Boolean}
 */
UrlBuilder.prototype.hasValue = function(keys) {

	if (keys === undefined)
		return false;

	if (typeof(keys) === 'string')
		keys = [keys];

	for (var i = 0; i < keys.length; i++) {
		var val = this.builder[keys[i]];
		if (val == null)
			return false;
	}

	return true;
};

/**
 * Render parameters
 * @param {String Array} keys Keys.
 * @param {String} delimiter Delimiter (default &).
 * @return {String}
 */
UrlBuilder.prototype.toOne = function(keys, delimiter) {
	var self = this;
	var builder = [];
	keys.forEach(key => builder.push(self.builder[key] || ''));
	return builder.join(delimiter || '&');
};

function RESTBuilder(url) {

	this.$schema;
	this.$length = 0;
	this.$transform = transforms.restbuilder_default;
	this.$persistentcookies = false;

	this.options = { url: url, timeout: 10000, method: 'GET', resolve: true, headers: { 'user-agent': 'Total.js/v' + F.version_header, accept: 'application/json, text/plain, text/plain, text/xml' }};

	// this.$data = {};
	// this.$nodnscache = true;
	// this.$cache_expire;
	// this.$cache_nocache;
	// this.$redirect

	// Auto Total.js Error Handling
	this.$errorbuilderhandler = true;
}

RESTBuilder.make = function(fn) {
	var instance = new RESTBuilder();
	fn && fn(instance);
	return instance;
};

RESTBuilder.url = function(url) {
	return new RESTBuilder(url);
};

RESTBuilder.GET = function(url, data) {
	var builder = new RESTBuilder(url);
	builder.options.query = data;
	return builder;
};

RESTBuilder.API = function(url, name, data) {

	var index;
	var qs = '';

	if (name == null) {

		index = url.indexOf(' ');
		name = url.substring(index + 1);
		url = url.substring(0, index);

	} else {
		index = url.indexOf('?');
		if (index !== -1) {
			qs = url.substring(index);
			url = url.substring(0, index);
		}
	}

	var builder = new RESTBuilder(url);
	builder.operation = name + qs;
	builder.options.method = 'POST';
	builder.raw(data, 'raw');

	return builder;
};

RESTBuilder.POST = function(url, data) {
	var builder = new RESTBuilder(url);
	builder.options.method = 'POST';
	data && builder.raw(data, 'json');
	return builder;
};

RESTBuilder.PUT = function(url, data) {
	var builder = new RESTBuilder(url);
	builder.options.method = 'PUT';
	data && builder.raw(data, 'json');
	return builder;
};

RESTBuilder.DELETE = function(url, data) {
	var builder = new RESTBuilder(url);
	builder.$method = 'delete';
	builder.options.method = 'DELETE';
	data && builder.raw(data, 'json');
	return builder;
};

RESTBuilder.PATCH = function(url, data) {
	var builder = new RESTBuilder(url);
	builder.$method = 'patch';
	builder.options.method = 'PATCH';
	data && builder.raw(data, 'json');
	return builder;
};

RESTBuilder.HEAD = function(url) {
	var builder = new RESTBuilder(url);
	builder.options.method = 'HEAD';
	return builder;
};

RESTBuilder.upgrade = function(fn) {
	restbuilderupgrades.push(fn);
};

/**
 * STATIC: Creates a transformation
 * @param {String} name
 * @param {Function} fn
 * @param {Boolean} isDefault Default transformation for all RESTBuilders.
 */
RESTBuilder.addTransform = function(name, fn, isDefault) {
	transforms.restbuilder[name] = fn;
	isDefault && RESTBuilder.setDefaultTransform(name);
};

RESTBuilder.setDefaultTransform = function(name) {
	if (name)
		transforms.restbuilder_default = name;
	else
		delete transforms.restbuilder_default;
};

var RESTP = RESTBuilder.prototype;

RESTP.error = function(err) {
	this.$errorhandler = err;
	return this;
};

RESTP.map = function(map) {

	var arr = map.split(',');
	var self = this;
	var reg = /=|:|\s/;
	var convertor = [];

	self.$map = [];

	for (var i = 0; i < arr.length; i++) {
		var item = arr[i].split(reg);
		var target = (item[2] || item[0]).trim();
		convertor.push(target + ':' + (item[1].trim() || 'string'));
		self.$map.push({ id: item[0], target: target });
	}

	if (convertor.length)
		self.$mapconvertor = convertor.join(',');

	return self;
};

RESTP.unixsocket = function(socket, path) {
	var self = this;
	self.options.unixsocket = { socket: socket, path: path };
	return self;
};

RESTP.promise = function(fn) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.exec(function(err, result) {
			if (err)
				reject(err);
			else
				resolve(fn == null ? result : fn(result));
		});
	});
};

RESTP.proxy = function(value) {
	this.options.proxy = value;
	return this;
};

RESTP.setTransform = function(name) {
	this.$transform = name;
	return this;
};

RESTP.url = function(url) {
	if (url === undefined)
		return this.options.url;
	this.options.url = url;
	return this;
};

RESTP.cert = function(key, cert, dhparam) {
	this.options.key = key;
	this.options.cert = cert;
	this.options.dhparam = dhparam;
	return this;
};

RESTP.file = function(name, filename, buffer) {
	var obj = { name: name, filename: filename, buffer: buffer };
	if (this.options.files)
		this.options.files.push(obj);
	else
		this.options.files = [obj];
	return this;
};

RESTP.maketransform = function(obj, data) {
	if (this.$transform) {
		var fn = transforms.restbuilder[this.$transform];
		return fn ? fn.call(this, obj, data) : obj;
	}
	return obj;
};

RESTP.timeout = function(number) {
	this.options.timeout = number;
	return this;
};

RESTP.maxlength = function(number) {
	this.options.limit = number;
	return this;
};

RESTP.auth = function(user, password) {
	this.options.headers.authorization = password == null ? user : 'Basic ' + Buffer.from(user + ':' + password).toString('base64');
	return this;
};

RESTP.convert = function(convert) {
	this.$convert = convert;
	return this;
};

RESTP.schema = function(name) {
	this.$schema = GETSCHEMA(name);
	if (!this.$schema)
		throw Error('RESTBuilder: Schema "{0}" not found.'.format(name));
	return this;
};

RESTP.nodnscache = function() {
	this.options.resolve = false;
	return this;
};

RESTP.nocache = function() {
	this.$nocache = true;
	return this;
};

RESTP.make = function(fn) {
	fn.call(this, this);
	return this;
};

RESTP.xhr = function() {
	this.options.xhr = true;
	return this;
};

RESTP.method = function(method, data) {
	this.options.method = method.charCodeAt(0) > 96 ? method.toUpperCase() : method;
	data && this.raw(data, 'json');
	return this;
};

RESTP.referer = RESTP.referrer = function(value) {
	this.options.headers.Referer = value;
	return this;
};

RESTP.origin = function(value) {
	this.options.headers.Origin = value;
	return this;
};

RESTP.robot = function() {
	if (this.options.headers['User-Agent'])
		this.options.headers['User-Agent'] += ' Bot';
	else
		this.options.headers['User-Agent'] = 'Bot';
	return this;
};

RESTP.mobile = function() {
	if (this.options.headers['User-Agent'])
		this.options.headers['User-Agent'] += ' iPhone';
	else
		this.options.headers['User-Agent'] = 'iPhone';
	return this;
};

RESTP.put = RESTP.PUT = function(data) {
	this.options.method = 'PUT';
	data && this.raw(data, this.options.type || 'json');
	return this;
};

RESTP.delete = RESTP.DELETE = function(data) {
	this.options.method = 'DELETE';
	data && this.raw(data, this.options.type || 'json');
	return this;
};

RESTP.get = RESTP.GET = function(data) {
	this.options.method = 'GET';
	this.options.query = data;
	return this;
};

RESTP.post = RESTP.POST = function(data) {
	this.options.method = 'POST';
	data && this.raw(data, this.options.type || 'json');
	return this;
};

RESTP.head = RESTP.HEAD = function() {
	this.options.method = 'HEAD';
	return this;
};

RESTP.patch = RESTP.PATCH = function(data) {
	this.options.method = 'PATCH';
	data && this.raw(data, this.options.type || 'json');
	return this;
};

RESTP.json = function(data) {
	data && this.raw(data, 'json');
	if (this.options.method === 'GET')
		this.options.method = 'POST';
	return this;
};

RESTP.urlencoded = function(data) {
	if (this.options.method === 'GET')
		this.options.method = 'POST';
	this.options.type = 'urlencoded';
	data && this.raw(data, this.options.type);
	return this;
};

RESTP.accept = function(ext) {
	var type;
	if (ext.length > 8)
		type = ext;
	else
		type = framework_utils.getContentType(ext);
	this.options.headers.Accept = type;
	return this;
};

RESTP.xml = function(data, replace) {

	if (this.options.method === 'GET')
		this.options.method = 'POST';

	if (replace)
		this.$replace = true;

	this.options.type = 'xml';
	data && this.raw(data, this.options.type);
	return this;
};

RESTP.redirect = function(value) {
	this.options.noredirect = !value;
	return this;
};

RESTP.raw = function(value, type) {
	this.options.type = type;
	this.options.body = value;
	return this;
};

RESTP.plain = function(val) {
	this.$plain = true;
	this.options.body = val;
	this.options.type = 'plain';
	return this;
};

RESTP.cook = function(value) {
	this.options.cook = value !== false;
	return this;
};

RESTP.cookies = function(obj) {
	this.options.cookies = obj;
	return this;
};

RESTP.cookie = function(name, value) {
	if (!this.options.cookies)
		this.options.cookies = {};
	this.options.cookies[name] = value;
	return this;
};

RESTP.header = function(name, value) {
	this.options.headers[name] = value;
	return this;
};

RESTP.type = function(value) {
	this.options.headers['Content-Type'] = value;
	return this;
};

function execrestbuilder(instance, callback) {
	instance.exec(callback);
}

RESTP.callback = function(fn) {

	var self = this;

	if (typeof(fn) === 'function') {
		setImmediate(execrestbuilder, self, fn);
		return self;
	}

	self.$ = fn;
	setImmediate(execrestbuilder, self);
	return new Promise(function(resolve, reject) {
		self.$resolve = resolve;
		self.$reject = reject;
	});
};

RESTP.csrf = function(value) {
	this.options.headers['X-Csrf-Token'] = value;
	return this;
};

RESTP.encrypt = function(key) {
	this.options.encrypt = key || DEF.secret_encryption;
	return this;
};

RESTP.compress = function(val) {
	this.$compress = val == null || val == true;
	return this;
};

RESTP.cache = function(expire) {
	this.$cache_expire = expire;
	return this;
};

RESTP.set = function(name, value) {
	if (!this.options.body)
		this.options.body = {};
	if (typeof(name) !== 'object') {
		this.options.body[name] = value;
	} else {
		var arr = Object.keys(name);
		for (var i = 0, length = arr.length; i < length; i++)
			this.options.body[arr[i]] = name[arr[i]];
	}
	return this;
};

RESTP.rem = function(name) {
	if (this.options.body && this.options.body[name])
		this.options.body[name] = undefined;
	return this;
};

RESTP.progress = function(fn) {
	this.options.onprogress = fn;
	return this;
};

RESTP.stream = function(callback) {
	var self = this;
	self.options.custom = true;
	setImmediate(streamresponse, self, callback);
	return self;
};

function streamresponse(builder, callback) {
	builder.exec(callback);
}

RESTP.keepalive = function() {
	this.options.keepalive = true;
	return this;
};

RESTP.exec = function(callback) {

	if (!callback)
		callback = NOOP;

	var self = this;

	if (self.operation) {

		// API
		if (self.options.body)
			self.options.body = { data: self.options.body };
		else
			self.options.body = {};

		if (self.options.query) {
			self.options.body.query = self.options.query;
			self.options.query = null;
		}

		self.options.body.schema = self.operation;
		self.options.body = JSON.stringify(self.options.body, self.$compress ? exports.json2replacer : null);
		self.options.type = 'json';
	}

	if (self.options.files && self.options.method === 'GET')
		self.options.method = 'POST';

	if (self.options.body && !self.options.files && typeof(self.options.body) !== 'string' && self.options.type !== 'raw')
		self.options.body = self.options.type === 'urlencoded' ? U.toURLEncode(self.options.body) : JSON.stringify(self.options.body);

	if (self.options.unixsocket && self.options.url) {
		if (!self.options.path)
			self.options.path = self.options.url;
		self.options.url = undefined;
	}

	self.$callback = callback;

	if (restbuilderupgrades.length) {
		for (var i = 0; i < restbuilderupgrades.length; i++)
			restbuilderupgrades[i](self);
	}

	var key;

	if (self.$cache_expire && !self.$nocache) {
		key = '$rest_' + ((self.options.url || '') + (self.options.socketpath || '') + (self.options.path || '') + (self.options.body || '')).hash(true);
		var data = F.cache.read2(key);
		if (data) {
			data = self.$transform ? self.maketransform(self.$schema ? self.$schema.make(data.value) : data.value, data) : self.$schema ? self.$schema.make(data.value) : data.value;

			if (self.$resolve) {
				self.$resolve(data);
				self.$reject = null;
				self.$resolve = null;
			} else
				callback(null, data, data);

			return self;
		}
	}

	self.$callback_key = key;
	self.options.callback = exec_callback;
	self.options.response = {};
	self.options.response.builder = self;
	self.request = REQUEST(self.options);
	return self;
};

function exec_callback(err, response) {

	var self = response.builder;

	if (self.options.custom) {
		if (self.$resolve) {
			if (err)
				self.$.invalid(err);
			else
				self.$resolve(response);
			self.$ = null;
			self.$reject = null;
			self.$resolve = null;
		} else
			self.$callback.call(self, err, response);
		return;
	}

	var callback = self.$callback;
	var key = self.$callback_key;
	var type = err ? '' : response.headers['content-type'] || '';
	var output = new RESTBuilderResponse();

	if (self.options.cook && self.options.cookies)
		output.cookies = self.options.cookies;

	if (type) {
		var index = type.lastIndexOf(';');
		if (index !== -1)
			type = type.substring(0, index).trim();
	}

	var ishead = response.status === 204;

	if (ishead) {
		output.value = response.status < 400;
	} else if (self.$plain) {
		output.value = response.response;
	} else {
		switch (type.toLowerCase()) {
			case 'text/xml':
			case 'application/xml':
				output.value = response.body ? response.body.parseXML(self.$replace ? true : false) : {};
				break;
			case 'application/x-www-form-urlencoded':
				output.value = response.body ? DEF.parsers.urlencoded(response.body) : {};
				break;
			case 'application/json':
			case 'text/json':
				output.value = response.body ? response.body.parseJSON(true) : null;
				break;
			default:
				output.value = response.body && response.body.isJSON() ? response.body.parseJSON(true) : null;
				break;
		}
	}

	if (output.value && self.$map) {

		var res;

		if (output.value instanceof Array) {
			res = [];
			for (var j = 0; j < output.value.length; j++) {
				var item = {};
				for (var i = 0; i < self.$map.length; i++) {
					var m = self.$map[i];
					if (output.value[j])
						item[m.target] = output.value[j][m.id];
				}
				if (self.$mapconvertor)
					item = CONVERT(item, self.$mapconvertor);
				res.push(item);
			}
		} else {
			res = {};
			for (var i = 0; i < self.$map.length; i++) {
				var m = self.$map[i];
				res[m.target] = output.value[m.id];
			}
			if (self.$mapconvertor)
				res = CONVERT(res, self.$mapconvertor);
		}

		output.value = res;
	}

	if (output.value == null)
		output.value = EMPTYOBJECT;

	output.response = response.body;
	output.status = response.status;
	output.headers = response.headers;
	output.hostname = response.host;
	output.origin = response.origin;
	output.cache = false;
	output.datetime = NOW;

	if (!err && self.$errorhandler) {
		if (typeof(self.$errorhandler) === 'function')
			err = self.$errorhandler(output.value);
		else if (!output.value || output.value === EMPTYOBJECT || (output.value instanceof Array && output.value.length))
			err = self.$errorhandler;
	}

	var val;

	if (self.$schema) {

		if (err) {
			if (self.$resolve) {
				self.$.invalid(err);
				self.$ = null;
				self.$reject = null;
				self.$resolve = null;
			} else
				callback(err, EMPTYOBJECT, output);
			return;
		}

		val = self.$transform ? self.maketransform(output.value, output) : output.value;

		if (self.$errorbuilderhandler) {
			// Is the response Total.js ErrorBuilder?
			if (val instanceof Array && val.length && val[0] && val[0].error) {
				err = ErrorBuilder.assign(val);
				if (err)
					val = EMPTYOBJECT;
				if (err) {
					callback(err, EMPTYOBJECT, output);
					return;
				}
			}
		}

		self.$schema.make(val, function(err, model) {

			if (!err && key && output.status === 200)
				F.cache.add(key, output, self.$cache_expire);

			if (self.$resolve) {

				if (err)
					self.$.invalid(err);
				else
					self.$resolve(model);

				self.$ = null;
				self.$reject = null;
				self.$resolve = null;
				return;
			}

			callback(err, err ? EMPTYOBJECT : model, output);
			output.cache = true;
		});

	} else {

		if (!err && key && output.status === 200)
			F.cache.add(key, output, self.$cache_expire);

		val = self.$transform ? self.maketransform(output.value, output) : output.value;

		if (self.$errorbuilderhandler) {
			// Is the response Total.js ErrorBuilder?
			if (val instanceof Array && val.length && val[0] && val[0].error) {
				err = ErrorBuilder.assign(val);
				if (err)
					val = EMPTYOBJECT;
			}
		}

		if (self.$convert && val && val !== EMPTYOBJECT)
			val = CONVERT(val, self.$convert);

		if (self.$resolve) {

			if (err)
				self.$.invalid(err);
			else
				self.$resolve(val);

			self.$ = null;
			self.$reject = null;
			self.$resolve = null;
			return;
		}

		callback(err, val, output);
		output.cache = true;
	}
}

function RESTBuilderResponse() {}

RESTBuilderResponse.prototype.cookie = function(name) {

	var self = this;
	if (self.cookies)
		return $decodeURIComponent(self.cookies[name] || '');

	self.cookies = {};

	var cookies = self.headers['set-cookie'];
	if (!cookies)
		return '';

	if (typeof(cookies) === 'string')
		cookies = [cookies];

	for (var i = 0; i < cookies.length; i++) {
		var line = cookies[i].split(';', 1)[0];
		var index = line.indexOf('=');
		if (index !== -1)
			self.cookies[line.substring(0, index)] = line.substring(index + 1);
	}

	return $decodeURIComponent(self.cookies[name] || '');
};

// Handle errors of decodeURIComponent
function $decodeURIComponent(value) {
	try
	{
		return decodeURIComponent(value);
	} catch (e) {
		return value;
	}
}

global.NEWTASK = function(name, fn, filter) {
	if (fn == null) {
		delete tasks[name];
	} else {
		tasks[name] = {};
		tasks[name].$owner = F.$owner();
		tasks[name].$filter = filter;
		var append = function(key, fn) {
			tasks[name][key] = fn;
		};
		fn(append);
	}
};

function taskrunner(obj, name, callback) {
	obj.exec(name, callback);
}

global.TASK = function(taskname, name, callback, options, value) {

	var tmp = taskname.split('/');

	if (typeof(name) !== 'string') {
		value = options;
		options = callback;
		callback = name;
		name = tmp[1];
	}

	if (!(options instanceof SchemaOptions || options instanceof OperationOptions || options instanceof TaskBuilder || options instanceof Controller)) {
		if (options)
			value = options;
		options = new Controller(null, { uri: EMPTYOBJECT, query: {}, body: {}, files: EMPTYARRAY });
		options.isConnected = false;
	}

	var obj = new TaskBuilder(options);
	obj.name = tmp[0];

	if (value)
		obj.value = value;

	if (obj.controller) {
		obj.controller.$filterschema = null;
		obj.controller.$filter = null;
	}

	name && setImmediate(taskrunner, obj, name, callback);
	return obj;
};

global.NEWOPERATION = function(name, fn, repeat, stop, binderror, filter) {

	if (typeof(repeat) === 'boolean') {
		filter = binderror;
		binderror = stop;
		stop = repeat;
		repeat = null;
	}

	if (typeof(repeat) === 'string') {
		filter = repeat;
		repeat = null;
	}

	if (typeof(stop) === 'string') {
		filter = stop;
		stop = null;
	}

	if (typeof(binderror) === 'string') {
		filter = binderror;
		binderror = null;
	}

	// @repeat {Number} How many times will be the operation repeated after error?
	// @stop {Boolean} Stop when the error is thrown
	// @binderror {Boolean} Binds error when chaining of operations
	// @filter {Object}

	// Remove operation
	if (fn == null) {
		delete operations[name];
	} else {
		operations[name] = fn;
		operations[name].$owner = F.$owner();
		operations[name].$repeat = repeat;
		operations[name].$stop = stop !== false;
		operations[name].$binderror = binderror === true;
		operations[name].$filter = filter;
	}
};

function getLoggerNameOperation(name) {
	return 'OPERATION(\'' + name + '\')';
}

function NoOp() {}

global.OPERATION = function(name, value, callback, param, controller) {

	if (typeof(value) === 'function') {
		controller = param;
		param = callback;
		callback = value;
		value = EMPTYOBJECT;
	}

	if (controller == null && (param instanceof Controller || param instanceof OperationOptions || param instanceof SchemaOptions || param instanceof TaskBuilder || param instanceof AuthOptions || param instanceof WebSocketClient)) {
		controller = param;
		param = undefined;
	}

	if (controller && controller.controller)
		controller = controller.controller;

	var fn = operations[name];

	var error = new ErrorBuilder();
	var $now;

	if (CONF.logger)
		$now = Date.now();

	if (fn) {

		if (fn.$filter && controller) {
			controller.$filterschema = fn.$filter;
			controller.$filter = null;
		}

		var self = new OperationOptions(error, value, param, controller);
		self.name = name;

		if (param instanceof SchemaOptions)
			self.schema = param.schema;

		self.$repeat = fn.$repeat;
		self.callback = function(value) {

			CONF.logger && F.ilogger(getLoggerNameOperation(name), controller, $now);
			if (arguments.length > 1) {
				if (value instanceof Error || (value instanceof ErrorBuilder && value.is)) {
					self.error.push(value);
					value = EMPTYOBJECT;
				} else
					value = arguments[1];
			} else if (value instanceof Error || (value instanceof ErrorBuilder && value.is)) {
				self.error.push(value);
				value = EMPTYOBJECT;
			}

			if (self.error.items.length && self.$repeat) {
				self.error.clear();
				self.$repeat--;
				fn(self);
			} else {
				if (callback) {
					if (value === NoOp)
						callback = null;
					else
						callback(self.error.is ? self.error : null, value, self.options);
				}
			}
			return self;
		};
		fn(self, self.value);
	} else {
		error.push('Operation "{0}" not found.'.format(name));
		callback && callback(error, EMPTYOBJECT, param);
	}
};

global.RUN = function(name, value, callback, param, controller, result) {

	if (typeof(value) === 'function') {
		result = controller;
		controller = param;
		param = callback;
		callback = value;
		value = EMPTYOBJECT;
	}

	if (param instanceof global.Controller || (param && param.isWebSocket)) {
		result = controller;
		controller = param;
		param = EMPTYOBJECT;
	} else if (param instanceof OperationOptions || param instanceof SchemaOptions || param instanceof TaskBuilder || param instanceof AuthOptions) {
		result = controller;
		controller = param.controller;
	}

	if (!result) {
		if (typeof(param) === 'string') {
			result = param;
			param = EMPTYOBJECT;
		} else if (typeof(controller) === 'string') {
			result = controller;
			controller = null;
		}
	}

	if (typeof(name) === 'string')
		name = name.split(',').trim();

	var error = new ErrorBuilder();
	var opt = new OperationOptions(error, value, param, controller);

	opt.meta = {};
	opt.meta.items = name;
	opt.response = {};
	opt.errors = error;
	opt.$multiple = true;

	opt.callback = function(value) {

		CONF.logger && F.ilogger(getLoggerNameOperation(opt.name), controller, opt.duration);

		if (arguments.length > 1) {
			if (value instanceof Error || (value instanceof ErrorBuilder && value.is)) {
				opt.error.push(value);
				value = EMPTYOBJECT;
			} else
				value = arguments[1];
		} else if (value instanceof Error || (value instanceof ErrorBuilder && value.is)) {
			opt.error.push(value);
			value = EMPTYOBJECT;
		}

		if (opt.error.items.length && opt.$repeat > 0) {
			opt.error.clear();
			opt.$repeat--;
			opt.repeated++;
			setImmediate(opt => opt.$current(opt), opt);
		} else {

			if (opt.error.items.length) {
				if (opt.$current.$binderror)
					value = opt.error.output(false);
			}

			if (opt.error.items.length && opt.$current.$stop) {
				error.push(opt.error);
				name = null;
				opt.next = null;
				callback(error, opt.response, opt);
			} else {

				// Because "controller_json_workflow_multiple()" returns error instead of results
				// error.push(opt.error);

				if (result && (result === opt.meta.current || result === opt.name))
					opt.output = value;

				opt.response[opt.name] = value;
				opt.meta.prev = opt.meta.current;
				opt.$next();
			}
		}
	};

	name.wait(function(key, next, index) {

		var fn = operations[key];
		if (!fn) {
			// What now?
			// F.error('Operation "{0}" not found'.format(key), 'RUN()');
			return next();
		}

		opt.repeated = 0;
		opt.error = new ErrorBuilder();
		opt.error.path = 'operation: ' + key;
		opt.meta.index = index;
		opt.name = opt.meta.current = key;
		opt.$repeat = fn.$repeat;
		opt.$current = fn;
		opt.$next = next;
		opt.meta.next = name[index];

		if (CONF.logger)
			opt.duration = Date.now();

		fn(opt, opt.value);

	}, () => callback(error.items.length ? error : null, result ? opt.output : opt.response, opt));
};

function OperationOptions(error, value, options, controller) {

	if (!controller && options instanceof global.Controller) {
		controller = options;
		options = EMPTYOBJECT;
	} else if (options === undefined)
		options = EMPTYOBJECT;

	this.controller = controller;
	this.model = this.value = value;
	this.error = error;
	this.options = options;
}

OperationOptions.prototype = {

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
		return this.controller && this.controller ? this.controller.req.sessionid : null;
	},

	get url() {
		return (this.controller ? this.controller.req.url : '') || '';
	},

	get language() {
		return (this.controller ? this.controller.language : '') || '';
	},

	get ip() {
		return this.controller ? this.controller.req.ip : null;
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
		return this.controller ? this.controller.req.files : null;
	},

	get body() {
		return this.controller ? this.controller.req.body : null;
	},

	get query() {
		return this.controller ? this.controller.req.query : null;
	},

	get mobile() {
		return this.controller ? this.controller.req.mobile : null;
	},

	get headers() {
		return this.controller ? this.controller.req.headers : null;
	},

	get ua() {
		return this.controller ? this.controller.req.ua : null;
	},

	get filter() {
		var ctrl = this.controller;
		if (ctrl && !ctrl.$filter)
			ctrl.$filter = ctrl.$filterschema ? CONVERT(ctrl.query, ctrl.$filterschema) : ctrl.query;
		return ctrl ? ctrl.$filter : EMPTYOBJECT;
	}

};

const OperationOptionsProto = OperationOptions.prototype;

OperationOptionsProto.encrypt = function(value) {
	if (this.req)
		this.req.$bodyencrypt = value == null || value === true;
	return this;
};

OperationOptionsProto.cancel = function() {
	var self = this;
	self.callback = null;
	self.error = null;
	self.controller = null;
	self.options = null;
	self.model = self.value = null;
	return self;
};

OperationOptionsProto.audit = function(message, type) {
	AUDIT(this, message, type);
	return this;
};

OperationOptionsProto.noop = function(nocustomresponse) {
	var self = this;
	!nocustomresponse && self.controller && self.controller.custom();
	self.callback(NoOp);
	return self;
};

OperationOptionsProto.successful = function(callback) {
	var self = this;
	return function(err, a, b, c) {
		if (err)
			self.invalid(err);
		else
			callback.call(self, a, b, c);
	};
};

OperationOptionsProto.redirect = function(url) {
	this.callback(new F.callback_redirect(url));
	return this;
};

OperationOptionsProto.DB = function() {
	return F.database(this.error);
};

OperationOptionsProto.done = function(arg) {
	var self = this;
	return function(err, response) {
		if (err) {
			self.error.push(err);
			self.callback();
		} else {

			var o;

			if (arg)
				o = SUCCESS(err == null, arg === true ? response : arg);
			else
				o = SUCCESS(err == null);

			if (self.$multiple) {
				var obj = {};
				for (var m in o) {
					if (o[m] != null)
						obj[m] = o[m];
				}
				o = obj;
			}

			self.callback(o);
		}
	};
};

OperationOptionsProto.success = function(a, b) {

	if (a && b === undefined && typeof(a) !== 'boolean') {
		b = a;
		a = true;
	}

	var o = SUCCESS(a === undefined ? true : a, b);

	if (this.$multiple) {
		var obj = {};
		for (var m in o) {
			if (o[m] != null)
				obj[m] = o[m];
		}
		o = obj;
	}

	this.callback(o);
	return this;
};

OperationOptionsProto.invalid = function(name, error, path, index) {

	var self = this;

	if (arguments.length) {
		self.error.push(name, error, path, index);
		self.callback();
		return self;
	}

	return function(err) {
		self.error.push(err);
		self.callback();
	};
};

function AuthOptions(req, res, callback) {
	this.req = req;
	this.res = res;
	this.processed = false;
	this.$callback = callback;
}

AuthOptions.prototype = {

	get url() {
		return this.req.url || '';
	},

	get language() {
		return this.req.language || '';
	},

	get ip() {
		return this.req.ip;
	},

	get params() {
		return this.req.params;
	},

	get files() {
		return this.req.files;
	},

	get body() {
		return this.req.body;
	},

	get query() {
		return this.req.query;
	},

	get mobile() {
		return this.controller ? this.controller.req.mobile : null;
	},

	get headers() {
		return this.req.headers;
	},

	get ua() {
		return this.req ? this.req.ua : null;
	}
};

const AuthOptionsProto = AuthOptions.prototype;

SchemaOptionsProto.cookie = OperationOptionsProto.cookie = TaskBuilderProto.cookie = AuthOptionsProto.cookie = function(name, value, expire, options) {
	var self = this;
	if (value === undefined)
		return self.req.cookie(name);
	if (value === null)
		expire = '-1 day';
	self.res.cookie(name, value, expire, options);
	return self;
};

AuthOptionsProto.invalid = function(user) {
	this.next(false, user);
};

AuthOptionsProto.done = function(response) {
	var self = this;
	return function(is, user) {
		self.next(is, response ? response : user);
	};
};

AuthOptionsProto.success = function(user) {
	this.next(true, user);
};

AuthOptionsProto.audit = function(message, type) {
	AUDIT(this, message, type);
	return this;
};

AuthOptionsProto.next = AuthOptionsProto.callback = function(is, user) {

	if (this.processed)
		return;

	// @is "null" for callbacks(err, user)
	// @is "true"
	// @is "object" is as user but "user" must be "undefined"

	if (is instanceof Error || is instanceof ErrorBuilder) {
		// Error handling
		is = false;
	} else if (is == null && user) {
		// A callback error handling
		is = true;
	} else if (user == null && is && is !== true) {
		user = is;
		is = true;
	}

	this.processed = true;
	this.$callback(is, user, this);
};

AuthOptions.wrap = function(fn) {
	return function(req, res, next) {
		fn(new AuthOptions(req, res, next));
	};
};

global.CONVERT = function(value, schema) {
	var key = schema;
	if (key.length > 50)
		key = key.hash();
	var fn = F.convertors[key];
	return fn ? fn(value) : convertorcompile(schema, value, key);
};

function convertorcompile(schema, data, key) {
	var prop = schema.split(',');
	var cache = [];
	for (var i = 0; i < prop.length; i++) {
		var arr = prop[i].split(':');
		var obj = {};

		var type = arr[1].toLowerCase().trim();
		var size = 0;
		var isarr = type[0] === '[';
		if (isarr)
			type = type.substring(1, type.length - 1);

		var index = type.indexOf('(');
		if (index !== -1) {
			size = +type.substring(index + 1, type.length - 1).trim();
			type = type.substring(0, index);
		}

		obj.name = arr[0].trim();
		obj.size = size;
		obj.type = type;
		obj.array = isarr;

		switch (type) {
			case 'string':
				obj.fn = $convertstring;
				break;
			case 'number':
				obj.fn = $convertnumber;
				break;
			case 'number2':
				obj.fn = $convertnumber2;
				break;
			case 'boolean':
				obj.fn = $convertboolean;
				break;
			case 'date':
				obj.fn = $convertdate;
				break;
			case 'uid':
				obj.fn = $convertuid;
				break;
			case 'upper':
				obj.fn = (val, obj) => $convertstring(val, obj).toUpperCase();
				break;
			case 'lower':
				obj.fn = (val, obj) => $convertstring(val, obj).toLowerCase();
				break;
			case 'capitalize':
				obj.fn = (val, obj) => $convertstring(val, obj).capitalize();
				break;
			case 'capitalize2':
				obj.fn = (val, obj) => $convertstring(val, obj).capitalize(true);
				break;
			case 'name':
				obj.fn = (val, obj) => toName($convertstring(val, obj));
				break;
			case 'base64':
				obj.fn = val => typeof(val) === 'string' ? val.isBase64() ? val : '' : '';
				break;
			case 'email':
				obj.fn = function(val, obj) {
					var tmp = $convertstring(val, obj);
					return tmp.isEmail() ? tmp : '';
				};
				break;
			case 'zip':
				obj.fn = function(val, obj) {
					var tmp = $convertstring(val, obj);
					return tmp.isZIP() ? tmp : '';
				};
				break;
			case 'phone':
				obj.fn = function(val, obj) {
					var tmp = $convertstring(val, obj);
					return tmp.isPhone() ? tmp : '';
				};
				break;
			case 'url':
				obj.fn = function(val, obj) {
					var tmp = $convertstring(val, obj);
					return tmp.isURL() ? tmp : '';
				};
				break;
			case 'json':
				obj.fn = function(val, obj) {
					var tmp = $convertstring(val, obj);
					return tmp.isJSON() ? tmp : '';
				};
				break;
			case 'object':
				obj.fn = val => val;
				break;
			case 'search':
				obj.fn = (val, obj) => $convertstring(val, obj).toSearch();
				break;
			default:
				obj.fn = val => val;
				break;
		}

		if (isarr) {
			obj.fn2 = obj.fn;
			obj.fn = function(val, obj) {
				if (!(val instanceof Array))
					val = val == null || val == '' ? [] : [val];
				var output = [];
				for (var i = 0, length = val.length; i < length; i++) {
					var o = obj.fn2(val[i], obj);
					switch (obj.type) {
						case 'email':
						case 'phone':
						case 'zip':
						case 'json':
						case 'url':
						case 'uid':
						case 'date':
							o && output.push(o);
							break;
						default:
							output.push(o);
							break;
					}
				}
				return output;
			};
		}

		cache.push(obj);
	}

	var fn = function(data) {
		var output = {};
		for (var i = 0, length = cache.length; i < length; i++) {
			var item = cache[i];
			output[item.name] = item.fn(data[item.name], item);
		}
		return output;
	};

	F.convertors[key] = fn;
	return fn(data);
}

function $convertstring(value, obj) {
	return value == null ? '' : typeof(value) !== 'string' ? obj.size ? value.toString().max(obj.size) : value.toString() : obj.size ? value.max(obj.size) : value;
}

function $convertnumber(value) {
	if (value == null)
		return 0;
	if (typeof(value) === 'number')
		return value;
	var num = +value.toString().replace(',', '.');
	return isNaN(num) ? 0 : num;
}

function $convertnumber2(value) {
	if (value == null)
		return null;
	if (typeof(value) === 'number')
		return value;
	var num = +value.toString().replace(',', '.');
	return isNaN(num) ? null : num;
}

function $convertboolean(value) {
	return value == null ? false : value === true || value == '1' || value === 'true' || value === 'on';
}

function $convertuid(value) {
	return value == null ? '' : typeof(value) === 'string' ? value.isUID() ? value : '' : '';
}

function $convertdate(value) {

	if (value == null)
		return null;

	if (value instanceof Date)
		return value;

	switch (typeof(value)) {
		case 'string':
		case 'number':
			return value.parseDate();
	}

	return null;
}

// ======================================================
// EXPORTS
// ======================================================

exports.RESTBuilder = RESTBuilder;
exports.ErrorBuilder = ErrorBuilder;
exports.Pagination = Pagination;
exports.Page = Page;
exports.UrlBuilder = UrlBuilder;
exports.SchemaOptions = SchemaOptions;
exports.TaskBuilder = TaskBuilder;
exports.OperationOptions = OperationOptions;
exports.RESTBuilderResponse = RESTBuilderResponse;
exports.AuthOptions = AuthOptions;
global.RESTBuilder = RESTBuilder;
global.RESTBuilderResponse = RESTBuilderResponse;
global.ErrorBuilder = ErrorBuilder;
global.Pagination = Pagination;
global.Page = Page;
global.UrlBuilder = global.URLBuilder = UrlBuilder;
global.TaskBuilder = TaskBuilder;

// Uninstall owners
exports.uninstall = function(owner) {

	if (!owner)
		return;

	Object.keys(operations).forEach(function(key) {
		if (operations[key].$owner === owner)
			delete operations[key];
	});

	exports.eachschema(function(group, name, schema) {
		schema.owner === owner && schema.destroy();
	});
};

exports.check_task = function(name) {
	return tasks[name];
};

exports.check_operation = function(name) {
	return operations[name];
};

TaskBuilderProto.audit = function(message, type) {
	AUDIT(this, message, type);
	return this;
};

TaskBuilderProto.invalid = function(err, msg) {
	var self = this;
	if (!self.$done) {
		!self.error && (self.error = new ErrorBuilder());
		self.error.push(err, msg);
		self.end();
	}
	return self;
};

TaskBuilderProto.push = function(name, fn) {
	var self = this;
	self.tasks[name] = fn;
	return self;
};

TaskBuilderProto.next = function() {
	var self = this;
	if (!self.$done) {
		self.current && self.controller && CONF.logger && F.ilogger((self.name || 'tasks') + '.' + self.current, self.controller, self.$now);
		self.prev = self.current;
		for (var i = 0; i < arguments.length; i++) {
			self.current = arguments[i];
			var task = self.tasks[self.current] || (self.name ? tasks[self.name] && tasks[self.name][self.current] : null);
			if (task) {
				task.call(self, self, self.value);
				return self;
			}
		}
		self.end();
	}
	return self;
};

TaskBuilderProto.next2 = function(name) {
	var self = this;
	return function(err) {
		if (err)
			self.invalid(err);
		else {
			if (name == null)
				self.end();
			else
				self.next(name);
		}
	};
};

TaskBuilderProto.end = function(data) {
	var self = this;
	self.$callback && self.$callback(self.error && self.error.is ? self.error : null, data || self.value);
	self.$done = true;
	return self;
};

TaskBuilderProto.done = function(send_value) {
	var self = this;
	return function(err, data) {
		if (err)
			self.invalid(err);
		else
			self.end(SUCCESS(true, send_value ? data : null));
	};
};

TaskBuilderProto.end2 = function(send_value) {
	var self = this;
	return function(err, data) {
		if (err)
			self.invalid(err);
		else
			self.end(send_value ? data : null);
	};
};

TaskBuilderProto.success = function(data) {
	return this.end(SUCCESS(true, data));
};

TaskBuilderProto.callback = function(fn) {
	var self = this;
	self.$callback = fn;
	return self;
};

TaskBuilderProto.exec = function(name, callback) {
	var self = this;

	if (callback)
		self.$callback = callback;

	if (CONF.logger)
		self.$now = Date.now();

	self.next(name);
	return self;
};