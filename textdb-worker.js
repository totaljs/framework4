require('./utils');

var STATS = { TYPE: 'stats', reading: 0, writing: 0, usage: 0 };
var counter = 0;
var reading = 0;
var writing = 0;
var readingstats = 0;
var writingstats = 0;
var statsid;
var lastusagedate;
var instances = {};

var inmemory = +(process.argv[3] || 0);
CONF.textdb_inmemory = inmemory;

process.totaldbworker = 1;
process.title = 'totaldbworker';
process.on('message', processcommand);

function processcommand(msg) {

	if (!msg || !msg.builder)
		return;

	var key = msg.builder.database;
	var instance = instances[key];

	if (!instance) {

		F.directory = process.argv[2];

		var filename;
		var db;

		if (msg.builder.type === 'textdb') {
			filename = msg.builder.onetime ? msg.builder.database : PATH.databases(msg.builder.database);
			db = require('./textdb-new');
			instance = db.TextDB(filename, !msg.builder.onetime);
		} else {
			filename = msg.builder.onetime ? msg.builder.database : PATH.databases(msg.builder.database);
			db = require('./textdb');
			instance = msg.builder.type === 'nosql' ? db.JsonDB(filename, !msg.builder.onetime) : db.TableDB(filename, msg.builder.schema, !msg.builder.onetime);
		}

		if (!msg.builder.onetime) {
			instances[key] = instance;
			instance.recount();
			msg.TYPE && setTimeout(processcommand, 100, msg);
			return;
		}
	}

	var callback;

	switch (msg.TYPE) {

		case 'find':
			reading++;
			instance.find().assign(msg.builder).callback(function(err, builder) {
				builder.TYPE = 'response';
				builder.date = true;
				process.send(builder);
			});
			break;

		case 'stats':
			var tmp = {};
			tmp.cid = msg.builder.cid;
			tmp.pendingwrite = instance.pending_update.length + instance.pending_append.length + instance.pending_remove.length;
			tmp.pendingread = instance.pending_reader.length + (instance.pending_reader2 ? instance.pending_reader2.length : 0) + (instance.pending_streamer ? instance.pending_streamer.length : 0);
			tmp.documents = instance.total;
			tmp.size = (instance.filesize || 0);
			tmp.TYPE = 'response';
			process.send(tmp);
			break;

		case 'find2':
			reading++;
			instance.find2().assign(msg.builder).callback(function(err, builder) {
				builder.TYPE = 'response';
				builder.date = true;
				process.send(builder);
			});
			break;

		case 'backups':
			reading++;
			instance.backups().assign(msg.builder).callback(function(err, builder) {
				builder.TYPE = 'response';
				process.send(builder);
			});
			break;

		case 'insert':

			callback = function(err, builder) {
				builder.TYPE = 'response';
				process.send(builder);
			};

			if (msg.builder && msg.builder.bulk instanceof Array) {
				var b;

				for (var i = 0; i < msg.builder.bulk.length; i++)
					b = instance.insert().assign(msg.builder.bulk[i]);

				if (b) {
					writing++;
					b.$callback2 = callback;
				}

			} else {
				writing++;
				instance.insert().assign(msg.builder).callback(callback);
			}

			break;

		case 'update':

			callback = function(err, builder) {
				builder.TYPE = 'response';
				process.send(builder);
			};

			if (msg.builder && msg.builder.bulk instanceof Array) {
				var b;
				for (var i = 0; i < msg.builder.bulk.length; i++)
					b = instance.update().assign(msg.builder.bulk[i]);

				if (b) {
					writing++;
					b.$callback2 = callback;
				}

			} else {
				writing++;
				instance.update().assign(msg.builder).callback(callback);
			}

			break;

		case 'remove':

			callback = function(err, builder) {
				builder.TYPE = 'response';
				process.send(builder);
			};

			if (msg.builder && msg.builder.bulk instanceof Array) {
				var b;

				for (var i = 0; i < msg.builder.bulk.length; i++)
					b = instance.remove().assign(msg.builder.bulk[i]);

				if (b) {
					writing++;
					b.$callback2 = callback;
				}

			} else {
				writing++;
				instance.remove().assign(msg.builder).callback(callback);
			}

			break;

		case 'memory':
			instance.memory(msg.builder.count, msg.builder.size);
			break;

		case 'alter':
			instance.alter(msg.builder.schema, err => process.send({ TYPE: 'response2', cid: msg.cid, err: err }));
			break;

		case 'clean':
			instance.clean(() => process.send({ TYPE: 'response', cid: msg.cid, success: true }));
			break;

		case 'clear':
			instance.clear(() => process.send({ TYPE: 'response', cid: msg.cid, success: true }));
			break;

		case 'recount':
			instance.recount();
			break;

		case 'drop':
			instance.drop();
			setTimeout(() => process.kill(0), 10000);
			break;

		case 'usage':
			process.send({ TYPE: 'response', cid: msg.cid, documents: instance.total || 0, size: instance.filesize || 0 });
			break;

		case 'lock':
			instance.lock(function(next) {
				instance.unlock = next;
				process.send({ TYPE: 'response', cid: msg.cid, success: true });
			});
			break;

		case 'unlock':
			if (instance.unlock) {
				instance.unlock();
				instance.unlock = null;
			}
			break;
	}
}

function measure() {

	if (counter++ > 100000000)
		counter = 0;

	var pendingread = 0;
	var pendingwrite = 0;
	var duration = 0;
	var documents = 0;

	STATS.size = 0;

	for (var key in instances) {
		var instance = instances[key];
		pendingread += instance.pending_reader.length + (instance.pending_reader2 ? instance.pending_reader2.length : 0) + (instance.pending_streamer ? instance.pending_streamer.length : 0);
		pendingwrite += instance.pending_update.length + instance.pending_append.length + instance.pending_remove.length;
		if (duration < instance.duration)
			duration = instance.duration;
		documents += instance.total;
		STATS.size += (instance.filesize || 0);
	}

	STATS.pendingwrite = pendingwrite;
	STATS.pendingread = pendingread;
	STATS.duration = duration;
	STATS.documents = documents;
	STATS.memory = (process.memoryUsage().heapUsed / 1024 / 1024).floor(2);
	lastusagedate = Date.now();

	setTimeout(measure_usage_response, 50);

	if (counter % 2 === 0) {
		writingstats = Math.abs(writingstats - writing);
		readingstats = Math.abs(writingstats - reading);
		reading = 0;
		writing = 0;
	} else {
		writingstats = writing;
		readingstats = reading;
	}

	STATS.reading = readingstats;
	STATS.writing = writingstats;
	process.send(STATS);
}

setTimeout(function() {
	process.send({ TYPE: 'ready' });
	measure();
}, 100);

statsid = setInterval(measure, 10000);

process.on('exit', function() {
	clearInterval(statsid);
});

process.on('disconnect', function() {
	clearInterval(statsid);
	process.kill(0);
});

function measure_usage_response() {
	var diff = (Date.now() - lastusagedate) - 50;
	if (diff > 50)
		diff = 50;
	STATS.usage = diff <= 2 ? 0 : ((diff / 50) * 100);
}