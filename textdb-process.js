const Fork = require('child_process').fork;
var CALLBACKS = {};
var COUNTER = 1;
var INSTANCE;

exports.init = function(directory, callback) {

	INSTANCE = Fork(__dirname + '/textdb-worker.js', [directory], { detached: true, serialization: 'advanced' });
	CALLBACKS = {};
	INSTANCE.on('message', function(msg) {

		if (COUNTER > 999999999)
			COUNTER = 1;

		switch (msg.TYPE) {
			case 'stats':
				msg.TYPE = undefined;
				F.stats.textdb = msg;
				break;
			case 'ready':
				INSTANCE.ready = true;
				callback && callback();
				break;
			case 'response':
				var cb = msg.cid ? CALLBACKS[msg.cid] : null;
				if (cb) {
					delete CALLBACKS[msg.cid];
					msg.TYPE = undefined;
					msg.cid = undefined;
					var response = msg.response;
					msg.response = undefined;
					cb(null, response, msg);
				}
				break;
		}
	});

	INSTANCE.on('error', err => console.log('TextDB error', err));

	INSTANCE.on('close', function() {
		var keys = Object.keys(CALLBACKS);
		var err = 'TextDB worker has been detached';
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			CALLBACKS[key](err);
			delete CALLBACKS[key];
		}
		INSTANCE.removeAllListeners();
		INSTANCE = null;
		setTimeout(() => exports.init(directory), 100);
	});

	INSTANCE.send2 = function(msg) {
		if (INSTANCE) {
			if (INSTANCE.ready)
				INSTANCE.send(msg);
			else
				setTimeout(INSTANCE.send2, 100, msg);
		}
	};

	prepare(INSTANCE);
	return INSTANCE;
};

exports.kill = function(INSTANCE) {
	if (INSTANCE.$key) {
		INSTANCE.kill();
		INSTANCE.$key = null;
		INSTANCE = null;
	}
};

function prepare(INSTANCE) {

	INSTANCE.cmd_find = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			CALLBACKS[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'find', builder: builder });
	};

	INSTANCE.cmd_find2 = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			CALLBACKS[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'find2', builder: builder });
	};

	INSTANCE.cmd_memory = function(builder) {
		INSTANCE.send2({ TYPE: 'memory', builder: builder });
	};

	INSTANCE.cmd_remove = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			CALLBACKS[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'remove', builder: builder });
	};

	INSTANCE.cmd_update = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			CALLBACKS[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'update', builder: builder });
	};

	INSTANCE.cmd_insert = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			CALLBACKS[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'insert', builder: builder });
	};

	INSTANCE.cmd_alter = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			CALLBACKS[id] = callback;
		INSTANCE.send2({ TYPE: 'alter', cid: id, builder: builder });
	};

	INSTANCE.cmd_lock = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			CALLBACKS[id] = callback;
		INSTANCE.send2({ TYPE: 'lock', cid: id, builder: builder });
	};

	INSTANCE.cmd_unlock = function(builder) {
		INSTANCE.send2({ TYPE: 'unlock', builder: builder });
	};

	INSTANCE.cmd_clean = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			CALLBACKS[id] = callback;
		INSTANCE.send2({ TYPE: 'clean', cid: id, builder: builder });
	};

	INSTANCE.cmd_backups = function(builder, callback) {
		builder.cid = COUNTER++;
		if (callback)
			CALLBACKS[builder.cid] = callback;
		INSTANCE.send2({ TYPE: 'backups', builder: builder });
	};

	INSTANCE.cmd_recount = function(builder) {
		INSTANCE.send2({ TYPE: 'recount', builder: builder });
	};

	INSTANCE.cmd_clear = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			CALLBACKS[id] = callback;
		INSTANCE.send2({ TYPE: 'clear', cid: id, builder: builder });
	};

	INSTANCE.cmd_drop = function(builder) {
		INSTANCE.send2({ TYPE: 'drop', builder: builder });
	};
}