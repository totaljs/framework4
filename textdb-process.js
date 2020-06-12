const Fork = require('child_process').fork;
var COUNTER = 1;
var INSTANCE;

exports.init = function(directory, callback) {

	INSTANCE = Fork(__dirname + '/textdb-worker.js', [directory], { detached: true, serialization: 'advanced' });
	INSTANCE.callbacks = {};
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
				var cb = msg.cid ? INSTANCE.callbacks[msg.cid] : null;
				if (cb) {
					delete INSTANCE.callbacks[msg.cid];
					msg.TYPE = undefined;
					msg.cid = undefined;
					var response = msg.response;
					msg.response = undefined;
					cb(null, response, msg);
				}
				break;
		}
	});

	INSTANCE.send2 = function(msg) {
		if (INSTANCE.ready)
			INSTANCE.send(msg);
		else
			setTimeout(INSTANCE.send2, 100, msg);
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
			INSTANCE.callbacks[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'find', builder: builder });
	};

	INSTANCE.cmd_find2 = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			INSTANCE.callbacks[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'find2', builder: builder });
	};

	INSTANCE.cmd_memory = function(builder) {
		INSTANCE.send2({ TYPE: 'memory', builder: builder });
	};

	INSTANCE.cmd_remove = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			INSTANCE.callbacks[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'remove', builder: builder });
	};

	INSTANCE.cmd_update = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			INSTANCE.callbacks[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'update', builder: builder });
	};

	INSTANCE.cmd_insert = function(builder, callback) {
		builder.cid = COUNTER++;

		if (callback)
			INSTANCE.callbacks[builder.cid] = callback;

		INSTANCE.send2({ TYPE: 'insert', builder: builder });
	};

	INSTANCE.cmd_alter = function(schema, builder, callback) {
		var id = COUNTER++;
		if (callback)
			INSTANCE.callbacks[id] = callback;
		INSTANCE.send2({ TYPE: 'alter', cid: id, schema: schema, builder: builder });
	};

	INSTANCE.cmd_lock = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			INSTANCE.callbacks[id] = callback;
		INSTANCE.send2({ TYPE: 'lock', cid: id, builder: builder });
	};

	INSTANCE.cmd_unlock = function(builder) {
		INSTANCE.send2({ TYPE: 'unlock', builder: builder });
	};

	INSTANCE.cmd_clean = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			INSTANCE.callbacks[id] = callback;
		INSTANCE.send2({ TYPE: 'clean', cid: id, builder: builder });
	};

	INSTANCE.cmd_recount = function(builder) {
		INSTANCE.send2({ TYPE: 'recount', builder: builder });
	};

	INSTANCE.cmd_clear = function(builder, callback) {
		var id = COUNTER++;
		if (callback)
			INSTANCE.callbacks[id] = callback;
		INSTANCE.send2({ TYPE: 'clear', cid: id, builder: builder });
	};

	INSTANCE.cmd_drop = function(builder) {
		INSTANCE.send2({ TYPE: 'drop', builder: builder });
	};
}