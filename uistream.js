if (!global.framework_utils)
	global.framework_utils = require('./utils');

const D = '__';

function Message() {
	this.ismessage = true;
}

function UIStream(name, errorhandler) {

	var t = this;
	t.error = errorhandler || console.error;
	t.name = name;
	t.meta = {};
	t.meta.components = {};
	t.meta.flow = {};
	t.meta.cache = {};
	t.stats = { messages: 0, mm: 0, minutes: 0 };
	t.mm = 0;
	t.$events = {};

	var counter = 1;

	setImmediate(function(t) {
		if (t.interval !== 0) {
			t.$interval = setInterval(function(t) {
				if (counter % 20 === 0) {
					t.stats.minutes++;
					t.stats.mm = t.mm;
					t.mm = 0;
					counter = 1;
				} else
					counter++;
				t.onstats && t.onstats(t.stats);
				t.$events.stats && t.emit('stats', t.stats);
			}, t.interval || 3000, t);
		}
	}, t);

	new framework_utils.EventEmitter2(t);
}

var UI = UIStream.prototype;

UI.register = function(name, declaration, config, callback, extend) {

	if (typeof(config) === 'function') {
		callback = config;
		config = null;
	}

	var self = this;
	var type = typeof(declaration);

	if (type === 'string') {
		try {
			declaration = new Function('instance', declaration);
		} catch (e) {
			callback && callback(e);
			self.error(e, 'register', name);
			return;
		}
	}

	var cache;
	var prev = self.meta.components[name];
	if (prev) {
		cache = prev.cache;
		prev.connected = false;
		prev.disabled = true;
		prev.destroy = null;
		prev.disconnect && prev.disconnect();
	}

	var curr = { id: name, main: self, connected: true, disabled: false, cache: cache || {}, config: config || {}, stats: {}, iscomponent: true };
	if (extend) {
		try {
			declaration(curr, require);
		} catch (e) {
			self.error(e, 'register', name);
			callback && callback(e);
			return;
		}
	} else
		curr.make = declaration;

	curr.config = CLONE(curr.config || curr.options);
	var errors = new ErrorBuilder();

	var done = function() {

		self.meta.components[name] = curr;
		self.onregister && self.onregister(curr);
		self.$events.register && self.emit('register', name, curr);
		curr.install && !prev && curr.install.call(curr, curr);

		// update all instances
		for (var key in self.meta.flow) {
			if (key !== 'paused') {
				var f = self.meta.flow[key];
				if (f.component === curr.id)
					self.initcomponent(key, curr);
			}
		}

		callback && callback(errors.length ? errors : null);
	};

	if (curr.npm && curr.npm.length) {
		curr.npm.wait(function(name, next) {
			NPMINSTALL(name, function(err) {

				if (err) {
					self.error(err, 'npm');
					errors.push(err);
				}

				next();
			});
		}, done);
	} else
		setImmediate(done);

	return curr;
};

UI.destroy = function() {
	var self = this;

	clearInterval(self.$interval);
	self.$interval = null;

	self.unload(function() {
		self.emit('destroy');
		self.meta = null;
		self.$events = null;
		delete F.ui[self.name];
	});

};

UI.unregister = function(name, callback) {

	var self = this;

	if (name == null) {
		Object.keys(self.meta.components).wait(function(key, next) {
			self.unregister(key, next);
		}, callback);
		return self;
	}

	var curr = self.meta.components[name];
	if (curr) {
		self.onunregister && self.onunregister(curr);
		self.$events.unregister && self.emit('unregister', name, curr);
		Object.keys(self.meta.flow).wait(function(key, next) {
			var instance = self.meta.flow[key];
			if (instance.component === name) {
				instance.ready = false;
				try {
					self.ondisconnect && self.ondisconnect(instance);
					curr.close && curr.close.call(instance, instance);
				} catch (e) {
					self.error(e, 'instance_close', instance.component);
				}
				delete self.meta.flow[key];
			}
			next();
		}, function() {
			curr.connected = false;
			curr.disabled = true;
			curr.uninstall && curr.uninstall.call(curr, curr);
			curr.destroy = null;
			curr.cache = null;
			delete self.meta.components[name];
			callback && callback();
		});
	} else
		callback && callback();

	return self;
};

UI.reconfigure = function(id, config, rewrite) {
	var self = this;
	var instance = self.meta.flow[id];
	if (instance) {

		if (rewrite)
			instance.config = config;
		else
			U.extend(instance.config, config);

		instance.configure && instance.configure(instance.config);
		self.onreconfigure && self.onreconfigure(instance);
	}
	return !!instance;
};

UI.ondashboard = function(a, b, c, d) {
	// this == instance
	this.main.$events.dashboard && this.main.emit('dashboard', this, a, b, c, d);
};

UI.onstatus = function(a, b, c, d) {
	// this == instance
	this.main.$events.status && this.main.emit('status', this, a, b, c, d);
};

UI.onerror = function(a, b, c, d) {
	// this == instance
	this.main.$events.error && this.main.emit('error', this, a, b, c, d);
};

UI.ondebug = function(a, b, c, d) {
	// this == instance
	this.main.$events.debug && this.main.emit('debug', this, a, b, c, d);
};

/*
UI.ondisconnect = function(instance) {
};

UI.onconnect = function(instance) {
};

UI.onreconfigure = function(instance) {
};

UI.onregister = function(component) {
};

UI.onunregister = function(component) {
};
*/

UI.unload = function(callback) {
	var self = this;
	var keys = Object.keys(self.meta.flow);
	keys.wait(function(key, next) {
		var current = self.meta.flow[key];
		current && self.ondisconnect && self.ondisconnect(current);
		current && current.close && current.close.call(current, current);
		delete self.meta.flow[key];
		next();
	}, function() {
		// uninstall components
		self.unregister(null, callback);
	});
	return self;
};

UI.load = function(components, design, callback) {

	// unload
	var self = this;
	self.unload(function() {

		var keys = Object.keys(components);
		var error = new ErrorBuilder();

		keys.wait(function(key, next) {
			var body = components[key];
			if (typeof(body) === 'string' && body.indexOf('<script ') !== -1) {
				self.add(key, body, function(err) {
					err && error.push(err);
					next();
				});
			} else {
				self.register(key, body, function(err) {
					err && error.push(err);
					next();
				});
			}

		}, function() {

			// Loads design
			self.use(design, function(err) {
				err && error.push(err);
				callback(err);
			});

		});
	});

	return self;
};


UI.use = function(schema, callback, reinit) {
	var self = this;

	if (typeof(schema) === 'string')
		schema = schema.parseJSON(true);
	else
		schema = CLONE(schema);

	if (typeof(callback) === 'boolean') {
		var tmp = reinit;
		reinit = callback;
		callback = tmp;
	}

	// schema.COMPONENT_ID.component = 'condition';
	// schema.COMPONENT_ID.config = {};
	// schema.COMPONENT_ID.connections = { '0': [{ id: 'COMPONENT_ID', index: '2' }] }

	var err = new ErrorBuilder();

	if (schema) {

		// var keys = Object.keys(self.meta.flow);
		var keys = Object.keys(schema);
		var ts = Date.now();

		if (self.meta.flow.paused)
			delete self.meta.flow.paused;

		keys.wait(function(key, next) {

			if (key === 'paused') {
				self.meta.flow.paused = schema.paused;
				next();
				return;
			}

			var current = self.meta.flow[key];
			var instance = schema[key];
			var component = instance.component ? self.meta.components[instance.component] : null;

			// Component not found
			if (!component) {
				err.push(key, '"' + instance.component + '" component not found.');
				self.ondisconnect && self.ondisconnect(current);
				current && current.close && current.close.call(current, current);
				delete self.meta.flow[key];
				next();
				return;
			}

			var fi = self.meta.flow[key];

			if (!fi || reinit) {
				self.meta.flow[key] = instance;
				var tmp = self.initcomponent(key, component);
				if (tmp)
					tmp.ts = ts;
			} else {
				fi.connections = instance.connections;
				fi.offset = instance.offset;
				fi.size = instance.size;
				fi.ts = ts;
				if (JSON.stringify(fi.config) !== JSON.stringify(instance.config)) {
					U.extend(fi.config, instance.config);
					fi.configure && fi.configure(fi.config);
					self.onreconfigure && self.onreconfigure(fi);
				}
			}

			next();

		}, function() {

			self.$events.schema && self.emit('schema', self.meta.flow);
			callback && callback(err.length ? err : null);

			for (var key in self.meta.flow) {
				if (key !== 'paused') {
					var instance = self.meta.flow[key];
					var component = self.meta.components[instance.component];
					if (instance.ts !== ts) {
						component.ready = false;
						self.ondisconnect && self.ondisconnect(instance);
						instance.close && instance.close.call(instance);
						delete self.meta.flow[key];
					}
				}
			}

		});

	} else {
		err.push('schema', 'Flow schema is invalid.');
		self.error(err, 'use');
		callback && callback(err);
	}

	return self;
};

UI.initcomponent = function(key, component) {

	var self = this;
	var instance = self.meta.flow[key];

	if (instance.ready) {
		// Closes old instance
		instance.ready = false;
		try {
			self.ondisconnect && self.ondisconnect(instance);
			instance.close && instance.close.call(instance);
		} catch (e) {
			self.onerror(e, 'instance_close', instance);
		}
	}

	instance.isinstance = true;
	instance.stats = { messages: 0 };
	instance.cache = {};
	instance.id = key;
	instance.module = component;
	instance.ready = false;

	if (instance.options) {
		instance.config = instance.options;
		delete instance.options;
	}

	var tmp = component.config;
	if (tmp)
		instance.config = instance.config ? U.extend(CLONE(tmp), instance.config) : CLONE(tmp);

	if (!instance.config)
		instance.config = {};

	instance.dashboard = self.ondashboard;
	instance.status = self.onstatus;
	instance.debug = self.ondebug;
	instance.throw = self.onerror;
	instance.main = self;

	self.onconnect && self.onconnect(instance);

	try {
		component.make && component.make.call(instance, instance, instance.config);
	} catch (e) {
		self.error(e, 'instance_make', instance);
		return;
	}

	if (instance.open) {
		instance.open.call(instance, (function(instance) {
			return function() {
				if (instance) {
					instance.ready = true;
					delete instance.open;
				}
			};
		})(instance));
	} else
		instance.ready = true;

	self.meta.flow[key] = instance;
	return instance;
};

function sendmessage(instance, message, event) {

	if (event) {
		message.$events.message && message.emit('message', message);
		message.main.$events.message && message.main.emit('message', message);
	}

	try {
		instance.message && instance.message.call(message.instance, message);
	} catch (e) {
		instance.main.error(e, 'instance_message', message);
	}

}

UI.$can = function(id) {
	var self = this;
	if (!self.meta.flow.paused)
		return true;
	if (!self.meta.flow.paused[id])
		return true;
};

UI.trigger = function(id, data, controller, events) {

	var self = this;

	var schema = self.meta.flow[id];
	if (schema && schema.ready && schema.component && schema.message) {

		var instance = self.meta.components[schema.component];
		if (instance && instance.connected && !instance.disabled && self.$can(id)) {

			var message = new Message();

			message.$events = events || {};
			message.controller = controller;
			message.instance = schema;
			message.used = 1;
			message.repo = {};
			message.main = self;
			message.data = data;
			message.cache = instance.cache;
			message.config = message.options = schema.config;
			message.processed = 0;
			schema.stats.messages++;
			message.main.stats.messages++;
			message.main.mm++;
			message.count = message.main.stats.messages;

			setImmediate(sendmessage, schema, message, true);
			return message;
		}
	}
};

UI.trigger2 = function(name, data, controller) {
	var self = this;
	var events = {};
	var obj;

	for (var key in self.meta.flow) {
		var flow = self.meta.flow[key];
		if (flow.component === name)
			obj = self.trigger(key, data, controller, events);
	}

	return obj;
};

UI.clear = function() {
	var self = this;
	self.meta.flow = {};
	return self;
};

UI.make = function(fn) {
	var self = this;
	fn.call(self, self);
	return self;
};

UI.find = function(id) {
	return this.meta.flow[id];
};

UI.send = function(path, body) {
	var self = this;
	if (self.meta && self.meta.flow) {
		path = path.split(D);
		var instance = self.meta.flow[path[0]];
		if (instance)
			instance.send(path[1], body);
		return !!instance;
	}
};

UI.add = function(name, body, callback) {

	var self = this;
	var meta = body.parseComponent({ settings: '<settings>', css: '<style>', be: '<script total>', be2: '<script node>', js: '<script>', html: '<body>', schema: '<schema>', template: '<template>' });
	var node = (meta.be || meta.be2 || '');

	meta.id = name;
	meta.checksum = node.md5();

	var component = self.meta.components[name];
	if (component && component.ui && component.ui.checksum === meta.checksum) {
		component.ui = meta;
		component.ts = Date.now();
		callback && callback();
	} else {

		var fn;

		try {
			fn = new Function('exports', 'require', node);
		} catch (e) {
			self.error(e, 'add', name);
			callback && callback(e);
			return null;
		}

		delete meta.be;
		delete meta.be2;
		component = self.register(meta.id, fn, null, callback, true);
		component.ui = meta;
	}

	component.ui.raw = body;
	return component;
};

UI.export = function() {

	var self = this;
	var output = {};

	for (var key in self.meta.flow) {

		var instance = self.meta.flow[key];
		if (key === 'paused') {
			output[key] = CLONE(instance);
			continue;
		}

		var tmp = {};
		tmp.x = instance.x;
		tmp.y = instance.y;
		tmp.offset = instance.offset;
		tmp.size = instance.size;
		tmp.stats = CLONE(instance.stats);
		tmp.connections = CLONE(instance.connections);
		tmp.id = instance.id;
		tmp.config = CLONE(instance.config);
		tmp.component = instance.component;
		tmp.connected = true;
		tmp.note = instance.note;
		tmp.reference = instance.reference;
		output[tmp.id] = tmp;
	}

	return output;
};

UI.instances = function() {

	var self = this;
	var arr = [];

	for (var key in self.meta.flow) {
		if (key !== 'paused') {
			var instance = self.meta.flow[key];
			if (instance.ready)
				arr.push(instance);
		}
	}

	return arr;
};

UI.components = function(prepare_export) {

	var self = this;
	var arr = [];

	for (var key in self.meta.components) {
		var com = self.meta.components[key];
		if (prepare_export) {
			var obj = {};
			obj.id = com.id;
			obj.type = com.type;
			obj.name = com.name;
			obj.title = com.title;
			obj.offset = com.offset;
			obj.size = com.size;
			obj.css = com.ui.css;
			obj.js = com.ui.js;
			obj.icon = com.icon;
			obj.config = com.config;
			obj.html = com.ui.html;
			obj.template = com.ui.template;
			obj.settings = com.ui.settings;
			obj.group = com.group;
			obj.version = com.version;
			obj.author = com.author;
			arr.push(obj);
		} else
			arr.push(com);
	}

	return arr;
};

exports.make = function(name, errorhandler) {
	return new UIStream(name, errorhandler);
};