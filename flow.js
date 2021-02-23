if (!global.framework_utils)
	global.framework_utils = require('./utils');

const D = '__';

function Message() {}

Message.prototype = {

	get user() {
		return this.controller ? this.controller.user : null;
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

	get headers() {
		return this.controller && this.controller.req ? this.controller.req.headers : null;
	},

	get ua() {
		return this.controller && this.controller.req ? this.controller.req.ua : null;
	}
};

var MP = Message.prototype;

MP.emit = function(name, a, b, c, d, e, f, g) {

	var self = this;

	if (!self.$events)
		return self;

	var evt = self.$events[name];
	if (evt) {
		var clean = false;
		for (var i = 0, length = evt.length; i < length; i++) {
			if (evt[i].$once)
				clean = true;
			evt[i].call(self, a, b, c, d, e, f, g);
		}
		if (clean) {
			evt = evt.remove(n => n.$once);
			self.$events[name] = evt.length ? evt : undefined;
		}
	}
	return self;
};

MP.on = function(name, fn) {
	var self = this;
	if (!self.$events)
		self.$events = {};
	if (self.$events[name])
		self.$events[name].push(fn);
	else
		self.$events[name] = [fn];
	return self;
};

MP.once = function(name, fn) {
	fn.$once = true;
	return this.on(name, fn);
};

MP.removeListener = function(name, fn) {
	var self = this;
	if (self.$events) {
		var evt = self.$events[name];
		if (evt) {
			evt = evt.remove(n => n === fn);
			self.$events[name] = evt.length ? evt : undefined;
		}
	}
	return self;
};

MP.removeAllListeners = function(name) {
	if (this.$events) {
		if (name === true)
			this.$events = {};
		else if (name)
			this.$events[name] = undefined;
		else
			this.$events = {};
	}
	return this;
};

MP.clone = function() {
	var self = this;
	var obj = new Message();
	obj.$events = self.$events;
	obj.duration = self.duration;
	obj.repo = self.repo;
	obj.main = self.main;
	obj.count = self.count;
	obj.data = self.data;
	obj.used = self.used;
	obj.processed = 0;
	return obj;
};

MP.end = MP.destroy = function() {
	var self = this;
	self.processed = 0;
	if (self.main)
		self.main.stats.pending--;
	if (self.instance)
		self.instance.stats.pending--;
	return self;
};

MP.status = function(a, b, c, d) {
	this.instance.status(a, b, c, d);
	return this;
};

MP.dashboard = function(a, b, c, d) {
	this.instance.dashboard(a, b, c, d);
	return this;
};

MP.debug = function(a, b, c, d) {
	this.instance.debug(a, b, c, d);
	return this;
};

MP.throw = function(a, b, c, d) {
	this.instance.error(a, b, c, d);
	return this;
};

MP.send = function(outputindex, data, clonedata) {

	var self = this;
	var outputs;
	var count = 0;

	if (outputindex == null) {
		if (self.instance.connections) {
			for (var key in self.instance.connections)
				count += self.send(key);
		}

		if (!count)
			self.destroy();

		return count;
	}

	var meta = self.main.meta;
	var now = Date.now();

	outputs = self.instance.connections ? (self.instance.connections[outputindex] || EMPTYARRAY) : EMPTYARRAY;

	if (self.processed === 0) {
		self.processed = 1;
		self.main.stats.pending--;
		self.instance.stats.pending--;
		self.instance.stats.output++;
		self.instance.stats.duration = now - self.duration2;
	}

	if (!self.main.$can(false, self.toid, outputindex)) {
		self.destroy();
		return count;
	}

	var tid = self.toid + D + outputindex;

	if (self.main.stats.traffic[tid]) {
		self.main.stats.traffic[tid]++;
	} else {
		self.main.stats.traffic[tid] = 1;
		self.main.stats.traffic.priority.push(tid);
	}

	for (var i = 0; i < outputs.length; i++) {
		var output = outputs[i];

		if (output.disabled || output.paused)
			continue;

		var schema = meta.flow[output.id];

		if (schema && (schema.message || schema['message_' + output.index]) && schema.component && schema.ready && self.main.$can(true, output.id, output.index)) {
			var next = meta.components[schema.component];
			if (next && next.connected && !next.disabled && (!next.$inputs || next.$inputs[output.index])) {

				var inputindex = output.index;
				var message = self.clone();

				if (data)
					message.data = data;

				if (clonedata && message.data && typeof(message.data) === 'object') {
					if (message.data instanceof Buffer) {
						var buf = Buffer.alloc(message.data.length);
						buf.copy(message.data);
						message.data = buf;
					} else
						message.data = CLONE(message.data);
				}

				message.used++;
				message.instance = schema;
				message.from = self.to;
				message.fromid = self.toid;
				message.fromindex = outputindex;
				message.fromcomponent = self.instance.component;
				message.to = message.schema = schema;
				message.toid = output.id;
				message.toindex = inputindex;
				message.index = inputindex;
				message.tocomponent = schema.component;
				message.cache = schema.cache;
				message.options = message.config = schema.config;
				message.duration2 = now;

				schema.stats.input++;
				schema.stats.pending++;

				self.main.stats.messages++;
				self.main.stats.pending++;
				self.main.mm++;

				self.$events.message && self.emit('message', message);
				self.main.$events.message && self.main.emit('message', message);
				setImmediate(sendmessage, schema, message, true);
				count++;
			}
		}
	}

	if (!count)
		self.destroy();

	return count;
};

MP.replace = function(data) {
	this.data = data;
	return this;
};

MP.destroy = function() {

	var self = this;

	if (self.processed === 0) {
		self.processed = 1;
		self.main.stats.pending--;
		self.schema.stats.pending--;
		self.schema.stats.output++;
		self.schema.stats.duration = Date.now() - self.duration2;
	}

	self.$events.end && self.emit('end', self);
	self.main.$events.end && self.main.emit('end', self);

	self.repo = null;
	self.main = null;
	self.from = null;
	self.to = null;
	self.data = null;
	self.options = self.config = null;
	self.duration = null;
	self.duration2 = null;
	self.$events = null;
};

function Flow(name, errorhandler) {

	var t = this;
	t.error = errorhandler || NOOP;
	t.name = name;
	t.meta = {};
	t.meta.components = {};
	t.meta.flow = {};
	t.meta.cache = {};
	t.stats = { messages: 0, pending: 0, traffic: { priority: [] }, mm: 0 };
	t.mm = 0;
	t.$events = {};

	var counter = 1;

	setImmediate(function(t) {
		if (t.interval !== 0) {
			t.$interval = setInterval(function(t) {

				var is = t.mm;

				if (counter % 20 === 0) {
					t.stats.mm = t.mm;
					t.mm = 0;
					counter = 1;
				} else
					counter++;

				t.$events.stats && t.emit('stats', t.stats);

				if (is)
					t.stats.traffic = { priority: [] };

			}, t.interval || 3000, t);
		}
	}, t);

	new framework_utils.EventEmitter2(t);
}

var FP = Flow.prototype;

FP.register = function(name, declaration, config, extend) {

	var self = this;
	var type = typeof(declaration);

	if (type === 'string')
		declaration = new Function('instance', declaration);

	var cache;
	var prev = self.meta.components[name];
	if (prev) {
		cache = prev.cache;
		prev.connected = false;
		prev.disabled = true;
		prev.destroy = null;
		prev.disconnect && prev.disconnect();
	}

	var curr = { id: name, main: self, connected: true, disabled: false, cache: cache || {}, config: config || {}, stats: {} };
	if (extend)
		declaration(curr, require);
	else
		curr.make = declaration;

	curr.config = CLONE(curr.config || curr.options);

	if (extend) {
		curr.$inputs = {};
		if (curr.inputs) {
			for (var i = 0; i < curr.inputs.length; i++) {
				var m = curr.inputs[i];
				if (curr.$inputs[m.id])
					curr.$inputs[m.id]++;
				else
					curr.$inputs[m.id] = 1;
			}
		}
	} else
		self.$inputs = null;

	self.meta.components[name] = curr;
	self.$events.register && self.emit('register', name, curr);

	curr.install && !prev && curr.install.call(curr, curr);
	curr.destroy = function() {
		self.unregister(name);
	};

	for (var key in self.meta.flow) {
		if (key !== 'paused') {
			var f = self.meta.flow[key];
			if (f.component === curr.id)
				self.initcomponent(key, curr);
		}
	}

	self.clean();
	return curr;
};

FP.destroy = function() {
	var self = this;

	clearInterval(self.$interval);
	self.$interval = null;

	self.unregister(null, function() {
		self.emit('destroy');
		self.meta = null;
		self.$events = null;
	});

	delete F.flows[self.name];
};

FP.cleanforce = function() {

	var self = this;

	if (!self.meta)
		return self;

	for (var key in self.meta.flow) {
		if (key !== 'paused') {
			var instance = self.meta.flow[key];
			if (instance.connections) {
				for (var key2 in instance.connections) {
					var conn = instance.connections[key2];
					var arr = conn.remove(c => self.meta.flow[c.id] == null);
					if (arr.length)
						instance.connections[key2] = arr;
					else
						delete instance.connections[key2];
				}
			}
		}
	}

	return self;
};

FP.unregister = function(name, callback) {

	var self = this;

	if (name == null) {
		Object.keys(self.meta.components).wait(function(key, next) {
			self.unregister(key, next);
		}, callback);
		return self;
	}

	var curr = self.meta.components[name];
	if (curr) {
		self.$events.unregister && self.emit('unregister', name, curr);
		Object.keys(self.meta.flow).wait(function(key, next) {
			var instance = self.meta.flow[key];
			if (instance.component === name) {
				instance.ready = false;
				curr.close && curr.close.call(instance, instance);
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
			self.clean();
		});
	} else
		callback && callback();

	return self;
};

FP.reconfigure = function(id, config) {
	var self = this;
	var instance = self.meta.flow[id];
	if (instance) {
		instance.config = U.extend(instance.config, config);
		instance.configure && instance.configure(instance.config);
	}
	return !!instance;
};

FP.clean = function() {
	var self = this;
	setTimeout2(self.name, () => self.cleanforce(), 1000);
	return self;
};

FP.ondashboard = function(a, b, c, d) {
	// this == instance
	this.main.$events.dashboard && this.main.emit('dashboard', this, a, b, c, d);
};

FP.onstatus = function(a, b, c, d) {
	// this == instance
	this.main.$events.status && this.main.emit('status', this, a, b, c, d);
};

FP.onerror = function(a, b, c, d) {
	// this == instance
	this.main.$events.error && this.main.emit('error', this, a, b, c, d);
};

FP.ondebug = function(a, b, c, d) {
	// this == instance
	this.main.$events.debug && this.main.emit('debug', this, a, b, c, d);
};

FP.ontrigger = function(outputindex, data, controller, events) {

	// this == instance

	var schema = this;
	var self = schema.main;
	var count = 0;

	if (schema && schema.ready && schema.component && schema.connections) {
		var instance = self.meta.components[schema.component];
		if (instance && instance.connected && !instance.disabled && self.$can(false, schema.id, outputindex)) {

			var conn = schema.connections[outputindex];
			if (conn && conn.length) {

				for (var i = 0; i < conn.length; i++) {

					var m = conn[i];
					var target = self.meta.flow[m.id];
					if (!target || (!target.message && !target['message_' + m.index]) || !self.$can(true, m.id, m.index))
						continue;

					var com = self.meta.components[target.component];
					if (!com || (com.$inputs && !com.$inputs[m.index]))
						continue;

					count++;

					var message = data instanceof Message ? data.clone() : new Message();
					message.$events = events || {};
					message.duration = message.duration2 = Date.now();
					message.controller = controller;
					message.instance = target;

					message.used = 1;
					message.repo = {};
					message.main = self;
					message.data = data;

					message.from = schema;
					message.fromid = schema.id;
					message.fromindex = outputindex;
					message.fromcomponent = schema.component;

					message.to = message.schema = target;
					message.toid = m.id;
					message.toindex = m.index;
					message.index = m.index;
					message.tocomponent = target.component;
					message.cache = target.cache;

					message.config = message.options = target.config;
					message.processed = 0;

					schema.stats.input++;
					schema.stats.pending++;

					message.main.stats.pending++;
					message.main.stats.messages++;
					message.main.mm++;

					message.count = message.main.stats.messages;

					if (message.fromid) {
						var tid = message.fromid + D + message.fromindex;
						if (message.main.stats.traffic[tid])
							message.main.stats.traffic[tid]++;
						else {
							message.main.stats.traffic[tid] = 1;
							message.main.stats.traffic.priority.push(tid);
						}
					}

					setImmediate(sendmessage, target, message, true);
				}
			}
		}
	}

	return count;
};

FP.use = function(schema, callback, reinit) {
	var self = this;

	if (typeof(schema) === 'string')
		schema = schema.parseJSON(true);

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
				current && current.close && current.close.call(current, current);
				delete self.meta.flow[key];
				next();
				return;
			}

			var fi = self.meta.flow[key];

			if (!fi || reinit) {
				self.meta.flow[key] = instance;
				self.initcomponent(key, component).ts = ts;
			} else {
				fi.connections = instance.connections;
				U.extend(fi.config, instance.config);
				fi.ts = ts;
				fi.configure && fi.configure(fi.config);
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
						instance.close && instance.close.call(instance);
						delete self.meta.flow[key];
					}
				}
			}

		});

	} else {
		err.push('schema', 'Flow schema is invalid.');
		self.error(err);
		callback && callback(err);
	}

	return self;
};

FP.initcomponent = function(key, component) {

	var self = this;
	var instance = self.meta.flow[key];

	if (instance.ready) {
		// Closes old instance
		instance.ready = false;
		instance.close && instance.close.call(instance);
	}

	instance.stats = { pending: 0, input: 0, output: 0, duration: 0 };
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
	instance.send = self.ontrigger;
	instance.main = self;
	component.make && component.make.call(instance, instance, instance.config);

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

	instance.message && instance.message.call(message.instance, message);
	var key = 'message_' + message.toindex;
	instance[key] && instance[key].call(message.instance, message);
}

FP.$can = function(isinput, id, index) {
	var self = this;
	if (!self.meta.flow.paused)
		return true;
	var key = (isinput ? 'input' : 'output') + D + id + D + index;
	if (!self.meta.flow.paused[key])
		return true;
};

// path = ID__INPUTINDEX
FP.trigger = function(path, data, controller, events) {

	path = path.split(D);

	var self = this;
	var inputindex = path.length === 1 ? 0 : path[1];

	var schema = self.meta.flow[path[0]];
	if (schema && schema.ready && schema.component && (schema.message || schema['message_' + inputindex])) {

		var instance = self.meta.components[schema.component];
		if (instance && instance.connected && !instance.disabled && self.$can(true, path[0], path[1])) {

			var message = new Message();

			message.$events = events || {};
			message.duration = message.duration2 = Date.now();
			message.controller = controller;
			message.instance = schema;

			message.used = 1;
			message.repo = {};
			message.main = self;
			message.data = data;

			message.from = null;
			message.fromid = null;
			message.fromindex = null;
			message.fromcomponent = null;

			message.to = message.schema = instance;
			message.toid = path[0];
			message.toindex = inputindex;
			message.index = inputindex;
			message.tocomponent = instance.id;
			message.cache = instance.cache;

			message.config = message.options = schema.config;
			message.processed = 0;

			schema.stats.input++;
			schema.stats.pending++;

			message.main.stats.pending++;
			message.main.stats.messages++;
			message.main.mm++;

			message.count = message.main.stats.messages;

			if (message.fromid) {
				var tid = message.fromid + D + message.fromindex;
				if (message.main.stats.traffic[tid])
					message.main.stats.traffic[tid]++;
				else {
					message.main.stats.traffic[tid] = 1;
					message.main.stats.traffic.priority.push(tid);
				}
			}

			setImmediate(sendmessage, schema, message, true);
			return message;
		}
	}
};

FP.trigger2 = function(path, data, controller) {
	var self = this;
	var keys = Object.keys(self.meta.flow);
	var events = {};
	var obj;

	path = path.split(D);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var flow = self.meta.flow[key];
		if (flow.component === path[0])
			obj = self.trigger(key + D + (path.length === 1 ? 0 : path[1]), data, controller, events);
	}

	return obj;
};

FP.clear = function() {
	var self = this;
	self.meta.flow = {};
	return self;
};

FP.make = function(fn) {
	var self = this;
	fn.call(self, self);
	return self;
};

FP.find = function(id) {
	return this.meta.flow[id];
};

FP.send = function(path, body) {
	var self = this;
	path = path.split(D);
	var instance = self.meta.flow[path[0]];
	if (instance)
		instance.send(path[1], body);
	return !!instance;
};

FP.add = function(name, body) {
	var self = this;
	var meta = body.parseComponent({ settings: '<settings>', css: '<style>', be: '<script total>', js: '<script>', html: '<body>', template: '<template>' });
	meta.id = name;
	meta.checksum = (meta.be || '').md5();
	var component = self.meta.components[name];

	if (component && component.ui && component.ui.checksum === meta.checksum) {
		component.ui = meta;
		component.ts = Date.now();
	} else {

		try {
			var fn = new Function('exports', 'require', meta.be);
			delete meta.be;
			component = self.register(meta.id, fn, null, true);
			component.ui = meta;
		} catch (e) {
			var err = new ErrorBuilder();
			err.push('component', 'Flow component: ' + name + ' - ' + e);
			self.error(err);
			return null;
		}
	}

	return component;
};

FP.instances = function() {

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

FP.components = function(prepare_export) {

	var self = this;
	var keys = Object.keys(self.meta.components);
	var arr = [];

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var com = self.meta.components[key];
		if (prepare_export) {

			var obj = {};
			obj.id = com.id;
			obj.name = com.name;
			obj.css = com.ui.css;
			obj.js = com.ui.js;
			obj.icon = com.icon;
			obj.config = com.config;
			obj.html = com.ui.html;
			obj.template = com.ui.template;
			obj.settings = com.ui.settings;
			obj.inputs = com.inputs;
			obj.outputs = com.outputs;
			obj.group = com.group;

			arr.push(obj);

		} else
			arr.push(com);
	}

	return arr;
};

exports.make = function(name, errorhandler) {
	return new Flow(name, errorhandler);
};