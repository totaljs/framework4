// Internal module

'use strict';

const PING = { TYPE: 'ping' };
const REG_BK = /-bk|_bk/i;

var FS = exports;

FS.module = require('./flow-flowstream');
FS.version = 40;
FS.db = {};
FS.worker = false;
FS.instances = {};
FS.onerror = function(err, source, id, componentid, stack) {

	var flow = FS.db[this.id];
	var empty = '---';
	var output = '';

	output += '|------------- FlowStreamError "' + id + '": ' + new Date().format('yyyy-MM-dd HH:mm:ss') + '\n';
	output += '| FlowStream: ' + flow.name + '\n';
	output += '| Source: ' + (source || empty) + '\n';
	output += '| Instance ID: ' + (id || empty) + '\n';
	output += '| Component ID: ' + (componentid || empty) + '\n';
	output += '| ' + err.toString();

	if (stack) {
		output += '\n|---- Stack: ----\n';
		output += stack;
	}

	console.error(output);

	if (F.$events.flowstream_error) {
		var meta = {};
		meta.id = flow.id;
		meta.name = flow.name;
		meta.error = err;
		meta.source = source;
		meta.instanceid = id;
		meta.componentid = componentid;
		FS.emit('flowstream_error', meta);
	}

};

U.EventEmitter2(FS);

FS.onsave = function(data) {
	// @data {Object} flowstream schema
	FS.$events.save && FS.emit('save', data);
};

FS.remove = function(id) {

	var tmp = FS.db[id];

	if (FS.instances[id]) {
		FS.instances[id].destroy();
		delete FS.instances[id];
	}

	if (tmp)
		delete FS.db[id];

	FS.$events.remove && FS.emit('remove', tmp);
};

FS.reload = function(flow, restart) {
	var prev = FS.instances[flow.id];
	if (!prev)
		return false;

	FS.db[flow.id] = flow;

	var instance = FS.instances[flow.id];
	instance.workertype = flow.worker;
	instance.proxypath = flow.proxypath;

	if (restart)
		instance.restart();
	else
		instance.reload(flow);

	return true;
};

FS.init = function(directory, callback) {

	if (typeof(directory) === 'function') {
		callback = directory;
		directory = null;
	}

	if (!directory)
		directory = F.path.root('flowstreams');

	F.Fs.readdir(directory, function(err, files) {

		if (err) {
			callback && callback();
			return;
		}

		var load = [];

		for (var m of files) {
			var index = m.lastIndexOf('.');
			if (index !== -1 && m.substring(index).toLowerCase() === '.flow' && !REG_BK.test(m))
				load.push(m);
		}

		load.wait(function(filename, next) {
			F.Fs.readFile(F.path.join(directory, filename), 'utf8', function(err, response) {
				if (response) {
					response = response.parseJSON();
					response.directory = directory;
					FS.load(response, () => next());
				} else
					next();
			});

		}, callback);

	});

};

FS.load = function(flow, callback) {

	// flow.directory {String}
	// flow.asfiles {Boolean}
	// flow.worker {String/Boolean}
	// flow.memory {Number}
	// flow.proxypath {String}

	if (!flow.id)
		flow.id = F.TUtils.random_string(10).toLowerCase();

	if (FS.instances[flow.id]) {
		FS.reload(flow);
		callback && setImmediate(callback, null, FS.instances[flow.id]);
		return;
	}

	var id = flow.id;
	flow.directory = flow.directory || F.path.root('/flowstream/');
	FS.db[id] = flow;

	FS.module.init(flow, flow.worker, function(err, instance) {

		instance.onerror = FS.onerror;
		instance.onsave = function(data) {
			data.unixsocket = flow.unixsocket;
			FS.db[id] = data;
			FS.onsave(data);
		};

		FS.instances[id] = instance;

		// instance.httprouting();
		instance.ondone = function(err) {
			FS.$events.load && FS.emit('load', instance, flow);
			callback && callback(err, err ? null : instance);
		};
	});

};

FS.notify = function(controller, id) {

	var $ = controller;
	var arr = id.split('-');
	var instance = FS.instances[arr[0]];
	if (instance) {
		var obj = {};
		obj.id = arr[1];
		obj.method = $.req.method;
		obj.headers = $.headers;
		obj.query = $.query;
		obj.body = $.body;
		obj.url = $.url;
		obj.ip = $.ip;
		obj.params = arr.length > 2 ? arr.slice(2) : EMPTYOBJECT;
		arr[1] && instance.notify(arr[1], obj);
		instance.flow && instance.flow.$socket && instance.flow.$socket.send({ TYPE: 'flow/notify', data: obj });
	}

	if ($.query.REDIRECT) {
		$.redirect($.query.REDIRECT);
		return;
	}

	var accept = $.headers.accept;
	if (accept && accept.indexOf('html') !== -1)
		$.html('<html><body style="font-family:Arial;font-size:11px;color:#777;background-color:#FFF">Close the window<script>window.close();</script></body></html>');
	else
		$.success();
};

FS.restart = function(id) {
	let item = FS.instances[id];
	if (item) {
		if (item.flow) {
			if (item.flow.terminate)
				item.flow.terminate();
			else
				item.flow.kill(9);
			return true;
		}
	}
};

FS.save = function(data) {
	FS.onsave(data);
};

function initping() {

	if (FS.ping)
		return;

	FS.ping = true;
	FS.off('load', initping);

	// A simple prevetion for the Flow zombie processes
	setInterval(function() {
		// ping all services
		for (var key in FS.instances) {
			var fs = FS.instances[key];
			if (fs.isworkerthread && fs.flow && fs.flow.postMessage2)
				fs.flow.postMessage2(PING);
		}
	}, 5000);
}

FS.on('load', initping);

global.Flow = FS;

setImmediate(function() {
	FS.socket = FS.module.socket;
	FS.client = FS.module.client;
});