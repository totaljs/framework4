if (!global.framework_utils)
	global.framework_utils = require('./utils');

const D = '__';

function Message() {
	this.ismessage = true;
	this.cloned = 0;
}

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

		for (var e of evt) {
			if (e.once)
				clean = true;
			e.fn.call(self, a, b, c, d, e, f, g);
		}

		if (clean) {
			var index = 0;
			while (true) {
				if (!evt[index])
					break;
				if (evt[index].once)
					evt.splice(index, 1);
				else
					index++;
			}
			self.$events[name] = evt.length ? evt : undefined;
		}
	}

	return self;
};

MP.emit2 = function(name, a, b, c, d, e, f, g) {

	var self = this;

	if (!self.$events)
		return self;

	var evt = self.$events[name];
	if (evt) {

		var clean = false;

		for (var e of evt) {
			if (e.cloned < self.cloned) {
				if (e.once)
					clean = true;
				e.fn.call(self, a, b, c, d, e, f, g);
			}
		}

		if (clean) {
			var index = 0;
			while (true) {
				var e = evt[index];
				if (!e)
					break;
				if (e.cloned < self.cloned) {
					if (e.once)
						evt.splice(index, 1);
					else
						index++;
				} else
					index++;
			}
			self.$events[name] = evt.length ? evt : undefined;
		}
	}

	return self;
};

MP.on = function(name, fn, once) {
	var self = this;
	if (!self.$events)
		self.$events = {};
	var obj = { cloned: self.cloned, fn: fn, once: once };
	if (self.$events[name])
		self.$events[name].push(obj);
	else
		self.$events[name] = [obj];
	return self;
};

MP.once = function(name, fn) {
	return this.on(name, fn, true);
};

MP.removeListener = function(name, fn) {
	var self = this;
	if (self.$events) {
		var evt = self.$events[name];
		if (evt) {
			evt = evt.remove(n => n.fn === fn);
			self.$events[name] = evt.length ? evt : undefined;
		}
	}
	return self;
};

MP.removeAllListeners = function(name) {
	var self = this;
	if (self.$events) {
		if (name === true)
			self.$events = {};
		else if (name)
			self.$events[name] = undefined;
		else
			self.$events = {};
	}
	return self;
};

MP.clone = function() {

	var self = this;
	var obj = new Message();
	obj.previd = self.id;
	obj.$events = self.$events;
	obj.duration = self.duration;
	obj.repo = self.repo;
	obj.vars = self.vars;
	obj.main = self.main;
	obj.refs = self.refs;
	obj.count = self.count;
	obj.data = self.data;
	obj.used = self.used;
	obj.processed = 0;
	obj.controller = self.controller;
	obj.cloned = self.cloned + 1;
	obj.$timeoutidtotal = self.$timeoutidtotal;

	// additional custom variables
	obj.uid = self.uid;
	obj.reference = self.reference;
	obj.ref = self.ref;

	if (obj.$events && obj.$events.timeout) {
		var index = 0;
		while (true) {
			var e = obj.$events.timeout[index];
			if (e) {
				if ((e.cloned + 1) < obj.cloned)
					obj.$events.timeout.splice(index, 1);
				else
					index++;
			} else
				break;
		}
	}

	if (self.$timeoutid) {
		clearTimeout(self.$timeoutid);
		self.$timeoutid = null;
	}

	return obj;
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
	this.instance.throw(a, b, c, d);
	return this;
};

MP.variables = function(str, data) {

	if (str.indexOf('{') !== -1) {

		str = str.args(this.vars);

		if (this.instance.main.variables) {
			if (str.indexOf('{') !== -1)
				str = str.args(this.instance.main.variables);
		}

		if (this.instance.main.variables2) {
			if (!this.instance.main.variables || str.indexOf('{') !== -1)
				str = str.args(this.instance.main.variables2);
		}

		if ((data == true || (data && typeof(data) === 'object')) && str.indexOf('{') !== -1)
			str = str.args(data == true ? this.data : data);
	}

	return str;
};

function timeouthandler(msg) {
	msg.error = 408;
	msg.$events.timeout && msg.emit('timeout', msg);
	msg.$events.timeout2 && msg.emit('timeout2', msg);
	msg.end();
}

MP.send = function(outputindex, data, clonedata) {

	var self = this;

	if (self.isdestroyed || (self.instance && self.instance.isdestroyed))
		return 0;

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
			if (next && next.connected && !next.isdestroyed && !next.disabled && (!next.$inputs || next.$inputs[output.index])) {

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

				if (self.$timeout)
					message.$timeoutid = setTimeout(timeouthandler, self.$timeout, message);

				schema.stats.input++;
				schema.stats.pending++;

				self.main.stats.messages++;
				self.main.stats.pending++;
				self.main.mm++;

				if (self.$events) {
					self.$events.next && self.emit2('next', self, message);
					self.$events.something && self.emit2('something', self, message);
					self.$events.message && self.emit('message', message);
				}

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

MP.totaltimeout = function(callback, time) {

	if (time == null)
		time = callback;
	else
		this.on('timeout2', callback);

	this.$timeoutidtotal && clearTimeout(this.$timeoutidtotal);
	this.$timeoutidtotal = setTimeout(timeouthandler, time, this);
	return this;
};

MP.timeout = function(callback, time) {

	if (time == null)
		time = callback;
	else
		this.on('timeout', callback);

	this.$timeout = time;
	return this;
};

MP.end = MP.destroy = function() {

	var self = this;

	if (self.isdestroyed)
		return;

	if (self.processed === 0) {
		self.processed = 1;
		self.main.stats.pending--;
		self.schema.stats.pending--;
		self.schema.stats.duration = Date.now() - self.duration2;
		self.schema.stats.destroyed++;
	}

	if (self.$timeoutid) {
		clearTimeout(self.$timeoutid);
		self.$timeoutid = null;
	}

	if (self.$timeoutidtotal) {
		clearTimeout(self.$timeoutidtotal);
		self.$timeoutidtotal = null;
	}

	if (self.$events) {
		self.$events.something && self.emit('something', self);
		self.$events.end && self.emit('end', self);
		self.$events.destroy && self.emit('destroy', self);
	}

	if (self.main.$events)
		self.main.$events.end && self.main.emit('end', self);

	self.isdestroyed = true;
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
	t.loading = 0;
	t.error = errorhandler || console.error;
	t.id = t.name = name;
	t.uid = Date.now().toString(36) + 'X';
	t.meta = {};
	t.meta.components = {};
	t.meta.flow = {};
	t.meta.cache = {};
	t.stats = { messages: 0, pending: 0, traffic: { priority: [] }, mm: 0, minutes: 0 };
	t.mm = 0;
	t.$events = {};

	var counter = 1;

	setImmediate(function(t) {
		if (t.interval !== 0) {
			t.$interval = setInterval(function(t) {

				var is = t.mm;

				if (counter % 20 === 0) {

					t.stats.minutes++;
					t.stats.mm = t.mm;
					t.mm = 0;
					counter = 1;

					for (var key in t.meta.flow) {
						var com = t.meta.flow[key];
						com.service && com.service(t.stats.minutes);
					}

				} else
					counter++;

				t.onstats && t.onstats(t.stats);
				t.$events.stats && t.emit('stats', t.stats);

				if (is)
					t.stats.traffic = { priority: [] };

			}, t.interval || 3000, t);
		}
	}, t);

	new framework_utils.EventEmitter2(t);
}

var FP = Flow.prototype;

FP.register = function(name, declaration, config, callback, extend) {

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

	var curr = { id: name, main: self, connected: true, disabled: false, cache: cache || {}, config: config || {}, stats: {}, ui: {}, iscomponent: true };
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

	var errors = new ErrorBuilder();
	var done = function() {

		self.loading--;

		self.meta.components[name] = curr;
		self.onregister && self.onregister(curr);
		self.$events.register && self.emit('register', name, curr);
		curr.install && !prev && curr.install.call(curr, curr);

		for (var key in self.meta.flow) {
			if (key !== 'paused') {
				var f = self.meta.flow[key];
				if (f.component === curr.id)
					self.initcomponent(key, curr);
			}
		}

		self.clean();
		callback && callback(errors.length ? errors : null);
	};

	self.loading++;

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

FP.destroy = function() {
	var self = this;

	clearInterval(self.$interval);
	self.$interval = null;

	self.loading++;
	self.unload(function() {
		self.loading--;
		self.emit('destroy');
		self.meta = null;
		self.$events = null;
		delete F.flows[self.name];
	});

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
		self.onunregister && self.onunregister(curr);
		self.$events.unregister && self.emit('unregister', name, curr);
		self.loading++;
		Object.keys(self.meta.flow).wait(function(key, next) {

			var instance = self.meta.flow[key];
			if (instance) {
				if (instance.component === name) {
					instance.ready = false;
					try {
						instance.isdestroyed = true;
						self.ondisconnect && self.ondisconnect(instance);
						curr.close && curr.close.call(instance);
						curr.destroy && curr.destroy.call(instance);
					} catch (e) {
						self.onerror(e, 'instance_close', instance);
					}
					delete self.meta.flow[key];
				}
			} else
				delete self.meta.flow[key];

			next();

		}, function() {
			self.loading--;
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

FP.clean = function() {
	var self = this;
	setTimeout2(self.name, () => self.cleanforce(), 1000);
	return self;
};

/*
FP.ondisconnect = function(instance) {
};

FP.onconnect = function(instance) {
};

FP.onregister = function(component) {
};

FP.onunregister = function(component) {
};

FP.onreconfigure = function(instance) {

};
*/

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

function newmessage(data) {
	var self = this;
	var msg = new Message();
	msg.refs = {};
	msg.repo = {};
	msg.vars = {};
	msg.data = data instanceof Message ? data.data : data;
	msg.cloned = 0;
	msg.count = 0;
	msg.instance = self;
	msg.duration = msg.duration2 = Date.now();
	msg.used = 1;
	msg.main = self instanceof Flow ? self : self.main;
	msg.processed = 1;
	return msg;
}

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

				var ts = Date.now();

				for (var i = 0; i < conn.length; i++) {

					var m = conn[i];
					var target = self.meta.flow[m.id];
					if (!target || (!target.message && !target['message_' + m.index]) || !self.$can(true, m.id, m.index))
						continue;

					var com = self.meta.components[target.component];
					if (!com || (com.$inputs && !com.$inputs[m.index]))
						continue;

					if (target.isdestroyed || (data.instance && data.instance.isdestroyed))
						continue;

					var ismessage = data instanceof Message;
					var message = ismessage ? data.clone() : new Message();

					if (ismessage) {

						if (data.isdestroyed)
							return 0;

						if (data.processed === 0) {
							data.processed = 1;
							data.main.stats.pending--;
							if (data.instance) {
								data.instance.stats.pending--;
								data.instance.stats.output++;
								data.instance.stats.duration = ts - self.duration2;
							}
						}
					} else {

						message.$events = events || {};
						message.repo = {};
						message.vars = {};
						message.data = data;
						message.duration = message.duration2 = ts;
						message.used = 1;

					}

					message.main = self;
					message.controller = controller;
					message.instance = target;

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

					target.stats.pending++;
					target.stats.input++;
					schema.stats.output++;
					message.main.stats.pending++;
					message.main.stats.messages++;
					message.main.mm++;

					message.id = message.main.uid + message.main.stats.messages;
					message.count = message.main.stats.messages;

					if (message.fromid && !count) {
						var tid = message.fromid + D + message.fromindex;
						if (message.main.stats.traffic[tid])
							message.main.stats.traffic[tid]++;
						else {
							message.main.stats.traffic[tid] = 1;
							message.main.stats.traffic.priority.push(tid);
						}
					}

					if (ismessage && data.$timeout)
						message.$timeoutid = setTimeout(timeouthandler, data.$timeout, message);

					if (ismessage) {
						data.next && data.emit2('next', data, message);
						data.something && data.emit2('something', data, message);
						data.message && data.emit('message', message);
					}

					count++;
					setImmediate(sendmessage, target, message, true);
				}
			}
		}
	}

	return count;
};

FP.reconfigure = function(id, config, rewrite) {
	var self = this;
	var instance = self.meta.flow[id];
	if (instance && !instance.isdestroyed) {

		if (rewrite)
			instance.config = config;
		else
			U.extend(instance.config, config);

		instance.configure && instance.configure(instance.config);
		self.onreconfigure && self.onreconfigure(instance);
	}
	return !!instance;
};

FP.unload = function(callback) {
	var self = this;
	var keys = Object.keys(self.meta.flow);
	keys.wait(function(key, next) {
		var current = self.meta.flow[key];
		if (current) {
			current.isdestroyed = true;
			self.ondisconnect && self.ondisconnect(current);
			current.close && current.close.call(current);
			current.destroy && current.destroy.call(current);
		}
		delete self.meta.flow[key];
		next();
	}, function() {
		// uninstall components
		self.unregister(null, callback);
	});
	return self;
};

FP.load = function(components, design, callback) {

	// unload
	var self = this;

	if (self.loading) {
		setTimeout(() => self.load(components, design, callback), 200);
		return self;
	}

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

function use(self, schema, callback, reinit) {
	self.use(schema, callback, reinit);
}

FP.use = function(schema, callback, reinit) {

	var self = this;

	if (self.loading) {
		setTimeout(use, 200, self, schema, callback, reinit);
		return self;
	}

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

		self.loading++;
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

				if (current) {
					current.isdestroyed = true;
					self.ondisconnect && self.ondisconnect(current);
					current.close && current.close.call(current);
					current.destroy && current.destroy.call(current);
				}

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
				fi.x = instance.x;
				fi.y = instance.y;
				fi.ts = ts;
				if (JSON.stringify(fi.config) !== JSON.stringify(instance.config)) {
					U.extend(fi.config, instance.config);
					fi.configure && fi.configure(fi.config);
					self.onreconfigure && self.onreconfigure(fi);
				}
			}

			next();

		}, function() {

			for (var key in self.meta.flow) {
				if (key !== 'paused') {
					var instance = self.meta.flow[key];
					var component = self.meta.components[instance.component];
					if (instance.ts !== ts) {
						component.ready = false;
						instance.isdestroyed = true;
						self.ondisconnect && self.ondisconnect(instance);
						instance.close && instance.close.call(instance);
						instance.destroy && instance.destroy.call(instance);
						delete self.meta.flow[key];
					}
				}
			}

			self.loading--;
			self.$events.schema && self.emit('schema', self.meta.flow);
			callback && callback(err.length ? err : null);

		});

	} else {
		err.push('schema', 'Flow schema is invalid.');
		self.error(err, 'use');
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

		try {
			self.ondisconnect && self.ondisconnect(instance);
			instance.close && instance.close.call(instance);
		} catch (e) {
			self.onerror(e, 'instance_close', instance);
		}
	}

	instance.isinstance = true;
	instance.stats = { pending: 0, input: 0, output: 0, duration: 0, destroyed: 0 };
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

	instance.main = self;
	instance.dashboard = self.ondashboard;
	instance.status = self.onstatus;
	instance.debug = self.ondebug;
	instance.throw = self.onerror;
	instance.send = self.ontrigger;
	instance.newmessage = newmessage;

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

	if (instance.isdestroyed || message.isdestroyed) {
		message.destroy();
		return;
	}

	if (event) {
		message.$events && message.$events.message && message.emit('message', message);
		message.main.$events && message.main.$events.message && message.main.emit('message', message);
	}

	try {
		instance.message.call(message.instance, message);
		var key = 'message_' + message.toindex;
		instance[key] && instance[key].call(message.instance, message);
	} catch (e) {
		instance.main.error(e, 'instance_message', message);
		message.destroy();
	}
}

FP.$can = function(isinput, id, index) {
	var self = this;
	if (!self.meta.flow.paused)
		return true;
	var key = (isinput ? 'input' : 'output') + D + id + D + index;
	if (!self.meta.flow.paused[key])
		return true;
};

/*
function trigger(self, path, data, controller, events) {
	self.trigger(path, data, controller, events);
}*/

// path = ID__INPUTINDEX
FP.trigger = function(path, data, controller, events) {

	var self = this;
	if (self.loading) {
		// setTimeout(trigger, 200, self, path, data, controller, events);
		return;
	}

	path = path.split(D);

	var inputindex = path.length === 1 ? 0 : path[1];

	var schema = self.meta.flow[path[0]];
	if (schema && schema.ready && schema.component && (schema.message || schema['message_' + inputindex])) {

		var instance = self.meta.components[schema.component];
		if (instance && instance.connected && !instance.disabled && self.$can(true, path[0], path[1])) {

			var ts = Date.now();
			var ismessage = data instanceof Message;
			var message = ismessage ? data.clone() : new Message();

			if (ismessage) {
				if (data.processed === 0) {
					data.processed = 1;
					data.main.stats.pending--;
					data.instance.stats.pending--;
					data.instance.stats.output++;
					data.instance.stats.duration = ts - self.duration2;
				}
			} else {
				message.$events = events || {};
				message.repo = {};
				message.data = data;
				message.duration = message.duration2 = ts;
				message.used = 1;
			}

			message.controller = controller;
			message.instance = schema;

			message.main = self;
			message.from = null;
			message.fromid = null;
			message.fromindex = null;
			message.fromcomponent = null;

			message.to = message.schema = schema;
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

			message.id = message.main.uid + message.main.stats.messages;
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
	var events = {};
	var obj;

	path = path.split(D);

	var counter = 0;
	for (var key in self.meta.flow) {
		var flow = self.meta.flow[key];
		if (flow.component === path[0])
			obj = self.trigger(key + D + (path.length === 1 ? 0 : path[1]), data, controller, events, counter++);
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
	if (self.meta && self.meta.flow) {
		path = path.split(D);
		var instance = self.meta.flow[path[0]];
		if (instance)
			instance.send(path[1], body);
		return !!instance;
	}
};

FP.add = function(name, body, callback) {
	var self = this;
	var meta = body.parseComponent({ settings: '<settings>', css: '<style>', be: '<script total>', be2: '<script node>', js: '<script>', html: '<body>', schema: '<schema>', template: '<template>', readme: '<readme>' });
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

FP.export = function() {

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

FP.components = function(prepare_export) {

	var self = this;
	var arr = [];

	for (var key in self.meta.components) {
		var com = self.meta.components[key];
		if (prepare_export) {

			var obj = {};
			obj.id = com.id;
			obj.name = com.name;
			obj.title = com.title;
			obj.type = com.type;
			obj.css = com.ui.css;
			obj.js = com.ui.js;
			obj.icon = com.icon;
			obj.config = com.config;
			obj.html = com.ui.html;
			obj.readme = com.ui.readme;
			obj.template = com.ui.template;
			obj.settings = com.ui.settings;
			obj.inputs = com.inputs;
			obj.outputs = com.outputs;
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
	return new Flow(name, errorhandler);
};

exports.prototypes = function() {
	var obj = {};
	obj.Message = Message.prototype;
	obj.FlowStream = Flow.prototype;
	return obj;
};