function openclientmessage(msg) {

	var t = this;

	if (msg.type === 'init') {
		t.$opensync = msg;
		for (var key in t.$clients) {
			var client = t.$clients[key];
			client.meta = msg;
			client.type = msg.id;
			if (client.onready) {
				client.onready(msg);
				delete client.onready;
			}
		}
		return;
	}

	if (msg.callbackid) {
		var cb = t.$callbacks[msg.callbackid];
		if (cb) {
			delete t.$callbacks[msg.callbackid];
			cb.timeout && clearTimeout(cb.timeout);
			cb.fn(msg.error, msg.response);
		}
		return;
	}

	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.onmessage && client.onmessage.call(t, msg);
	}
}

function openclienterror(e) {

	var t = this;

	for (var key in t.$callbacks) {
		var cb = t.$callbacks[key];
		if (cb) {
			delete t.$callbacks[key];
			cb.fn(e instanceof Error ? e.message : e);
		}
	}

	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.onerror && client.onerror.call(e);
	}
}

function openclientopen() {
	var t = this;
	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.ononline && client.ononline(true);
		client.connected = true;
	}
}

function openclientclose() {
	var t = this;
	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.ononline && client.ononline(false);
		client.connected = false;
	}
}

function openclienttimeout(ws, key) {
	var cb = ws.$callbacks[key];
	if (cb) {
		cb.fn('timeout');
		cb.timeout = null;
		delete ws.$callbacks[key];
	}
}

exports.create = function(url, id) {

	url = url.replace(/^http/, 'ws');

	if (id) {
		for (var key in F.openclients) {
			var client = F.openclients[key];
			if (client.$clients[id])
				client.$clients[id].remove();
		}
	} else
		id = GUID(10);

	var opt = {};
	opt.id = id;
	opt.url = url;

	opt.send2 = function(msg, callback, filter, timeout) {

		if (typeof(filter) === 'number') {
			timeout = filter;
			filter = null;
		}

		var t = this;
		if (!t.ws.closed) {
			if (callback) {
				var key = (t.ws.$callbackindexer++) + '';
				t.ws.$callbacks[key] = { id: opt.id, fn: callback };
				if (timeout)
					t.ws.$callbacks[key].timeout = setTimeout(openclienttimeout, timeout, t.ws, key);
				msg.callbackid = key;
			}
			t.ws.send(msg, filter);
		} else if (callback)
			callback('offline');
		return !t.ws.closed;
	};

	opt.send = function(msg, callback, filter, timeout, count) {

		if (!opt.ws || count > 10) {
			callback && callback('offline');
			return;
		}

		if (opt.ws.closed) {
			if (opt.ws && opt.ws.$clients[opt.id])
				setTimeout(opt.send, 500, msg, callback, filter, timeout, (count || 0) + 1);
			else if (callback)
				callback('offline');
		} else
			opt.send2(msg, callback, filter, timeout);

		return opt;
	};

	opt.close = opt.remove = function() {
		var t = this;
		var client = t.ws.$clients[t.id];
		client.destroy && client.destroy();
		delete t.ws.$clients[t.id];

		for (var key in t.ws.$callbacks) {
			var cb = t.ws.$callbacks[key];
			if (cb.id === t.id) {
				cb.timeout && clearTimeout(cb.timeout);
				cb.fn('offline');
				delete t.ws.$callbacks[key];
			}
		}

		if (!Object.keys(t.ws.$clients).length) {
			t.ws.close();
			delete F.openclients[t.url];
		}
	};

	opt.ready = function(fn) {
		opt.onready = fn;
		return opt;
	};

	opt.message = function(fn) {
		opt.onmessage = fn;
		return opt;
	};

	opt.error = function(fn) {
		opt.onerror = fn;
		return opt;
	};

	opt.online = function(fn) {
		opt.ononline = fn;
		return opt;
	};

	opt.ws = F.openclients[url];

	if (!opt.ws) {
		opt.ws = require('./websocketclient').create();
		opt.ws.connect(url);
		F.openclients[url] = opt.ws;
		opt.ws.$clients = {};
		opt.ws.$callbacks = {};
		opt.ws.$callbackindexer = 0;
		opt.ws.on('message', openclientmessage);
		opt.ws.on('error', openclienterror);
		opt.ws.on('open', openclientopen);
		opt.ws.on('close', openclientclose);
	} else if (!opt.ws.closed && opt.ws.$opensync) {
		opt.meta = opt.ws.$opensync;
		opt.type = opt.ws.$opensync.id;
		opt.onready && opt.onready(opt.meta);
		opt.ononline && opt.ononline(true);
	}

	opt.ws.$clients[opt.id] = opt;
	return opt;
};