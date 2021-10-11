function openclientmessage(msg) {

	var t = this;

	if (msg.type === 'init') {
		t.$opensync = msg;
		for (var key in t.$clients) {
			var client = t.$clients[key];
			client.meta = msg;
			client.type = msg.id;
			if (client.ready) {
				client.ready(msg);
				delete client.ready;
			}
		}
		return;
	}

	if (msg.callbackid) {
		var cb = t.$callbacks[msg.callbackid];
		if (cb) {
			delete t.$callbacks[msg.callbackid];
			cb.fn(msg.error, msg.response);
		}
		return;
	}

	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.message && client.message.call(t, msg);
	}
}

function openclienterror(e) {

	var t = this;

	for (var key in t.$callbacks) {
		var cb = t.$callbacks[key];
		if (cb) {
			delete t.$callbacks[key];
			cb.fn(e.message);
		}
	}

	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.error && client.error.call(e);
	}
}

function openclientopen() {
	var t = this;
	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.online && client.online(true);
		client.connected = true;
	}
}

function openclientclose() {
	var t = this;
	for (var key in t.$clients) {
		var client = t.$clients[key];
		client.online && client.online(false);
		client.connected = false;
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

	opt.send = function(msg, callback, filter) {
		var t = this;
		if (!t.ws.closed) {
			if (callback) {
				var key = (t.ws.$callbackindexer++) + '';
				t.ws.$callbacks[key] = { id: opt.id, fn: callback };
				msg.callbackid = key;
			}
			t.ws.send(msg, filter);
		} else if (callback)
			callback('offline');
		return !t.ws.closed;
	};

	opt.remove = function() {
		var t = this;
		var client = t.ws.$clients[t.id];
		client.destroy && client.destroy();
		delete t.ws.$clients[t.id];

		for (var key in t.ws.$callbacks) {
			var cb = t.ws.$callbacks[key];
			if (cb.id === t.id) {
				cb.fn('offline');
				delete t.ws.$callbacks[key];
			}
		}

		if (!Object.keys(t.ws.$clients).length) {
			t.ws.close();
			delete F.openclients[t.url];
		}
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
		opt.ready && opt.ready(opt.meta);
	}

	opt.ws.$clients[opt.id] = opt;
	return opt;
};