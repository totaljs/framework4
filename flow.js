// Internal module

const FlowStream = require('./flow-flowstream');
const PING = { TYPE: 'ping' };

var FS = exports;

FS.version = 1;
FS.db = {};
FS.worker = false;
FS.ping = false;
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
		FS.$events.error && FS.emit('error', meta);
	}

};

U.EventEmitter2(FS);

FS.onsave = function(data) {
	// @data {Object} flowstream schema
	FS.$events.save && FS.emit('save', data);
};

FS.reload = function(flow, restart) {

	var prev = FS.db[flow.id];
	if (!prev)
		return;

	if (prev.worker) {
		if (prev.proxypath !== flow.proxypath)
			PROXY(prev.proxypath, null);
	}

	if (flow.worker && prev.proxypath !== flow.proxypath)
		PROXY(flow.proxypath, flow.unixsocket, false);

	FS.db[flow.id] = flow;
	FS.instance[flow.id].restart(flow, restart);
};

FS.init = function(directory, callback) {

	if (typeof(directory) === 'function') {
		callback = directory;
		directory = null;
	}

	if (!directory)
		directory = PATH.root('flowstreams');

	PATH.fs.readdir(directory, function(err, files) {

		var load = [];

		for (var m of files) {
			var index = m.lastIndexOf('.');
			if (index !== -1 && m.substring(index).toLowerCase() === '.flow')
				load.push(m);
		}

		load.wait(function(filename, next) {

			PATH.fs.readFile(PATH.join(directory, filename), 'utf8', function(err, response) {

				if (response) {
					response = response.parseJSON();
					response.directory = directory;
					FS.load(response, function() {
						next();
					});
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

	var id = flow.id;
	flow.directory = flow.directory || PATH.root('/flowstream/');
	FS.db[id] = flow;
	flow.worker && initping();

	F.$owner('flowstream_' + id);

	FlowStream.init(flow, flow.worker, function(err, instance) {

		FS.$events.load && FS.emit('load', instance, flow);

		if (flow.worker && flow.proxypath) {

			// Removes old
			PROXY(flow.proxypath, null);

			// Registers new
			PROXY(flow.proxypath, flow.unixsocket, false);

		}

		// instance.httprouting();
		instance.ondone = callback;
		instance.onerror = FS.onerror;

		instance.onsave = function(data) {
			data.unixsocket = flow.unixsocket;
			FS.db[id] = data;
			FS.onsave(data);
		};

		FS.instances[id] = instance;
	});

};

FS.socket = FlowStream.socket;
FS.client = FlowStream.client;

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

function initping() {

	if (FS.ping)
		return;

	FS.ping = true;

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

global.Flow = FS;
global.FlowStream = exports;