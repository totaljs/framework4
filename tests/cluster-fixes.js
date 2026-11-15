// F.cluster.request()/response() with forked workers and F.cluster.on() with two listeners.
//   cd tests && node cluster-fixes.js

const Path = require('path');
const Fs = require('fs');
const Cluster = require('cluster');
const DIR = Path.join(__dirname, 'tmp', 'cluster-fixes');

require('../index');

const Assert = require('assert');

if (Cluster.isMaster)
	Fs.mkdirSync(DIR, { recursive: true });

if (Cluster.isMaster) {

	var calls = [];

	var finish = function(code) {
		for (var id in Cluster.workers)
			Cluster.workers[id].process.kill('SIGKILL');
		try {
			Fs.rmSync(DIR, { recursive: true, force: true });
			Fs.unlinkSync(__filename + '.json');
		} catch (e) {}
		process.exit(code);
	};

	// F.cluster.on() with a second listener for the same name
	try {
		F.cluster.on('result', function(a) {
			calls.push('A:' + a);
		});
		F.cluster.on('result', function(a) {
			calls.push('B:' + a);
			try {
				var result = JSON.parse(a);
				Assert.strictEqual(result.err, null, 'request() must not time out');
				Assert.strictEqual(result.response.length, 1, 'request() must collect the replies of the other workers only');
				Assert.strictEqual(result.selfanswered, false, 'the sender must not answer its own request');
				Assert.notStrictEqual(result.response[0], result.id, 'the reply must come from the other worker');
				Assert.strictEqual(result.errors.length, 0, 'a stray reply must not throw: ' + result.errors.join(', '));
				Assert.deepStrictEqual(calls.map(n => n[0]), ['A', 'B'], 'both listeners must be called');
			} catch (e) {
				console.error(e);
				finish(1);
				return;
			}
			console.log('OK');
			finish(0);
		});
	} catch (e) {
		console.error(e);
		process.exit(1);
	}

	setTimeout(function() {
		console.error('Timeout');
		finish(1);
	}, 20000);

	F.cluster.http(2, 'release', { port: 8391, ip: '127.0.0.1', directory: DIR, logs: 'isolated' });

} else {

	F.cluster.http(2, 'release', { port: 8391, ip: '127.0.0.1', directory: DIR });

	var errors = [];
	var selfanswered = false;
	process.on('uncaughtException', function(e) {
		errors.push(e.message);
	});

	ON('ready', function() {

		F.cluster.response('whoami', function(data, reply) {
			if (data && data.from === F.id)
				selfanswered = true;
			reply(F.id);
		});

		if (F.id !== '1')
			return;

		setTimeout(function() {
			F.cluster.request('whoami', { from: F.id }, function(err, response) {
				// waits for stray replies
				setTimeout(function() {
					F.cluster.master('result', JSON.stringify({ id: F.id, err: err, response: response, errors: errors, selfanswered: selfanswered }));
				}, 1000);
			}, 5000);
		}, 2000);
	});
}
