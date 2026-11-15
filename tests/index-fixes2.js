// Cache persistence, CACHE.removeAll([]), res.proxy(), PROXY() with a unix socket, CORS() header flags and thread/fork pools.
//   cd tests && node index-fixes2.js

require(process.env.FRAMEWORK || '../index');

const Fs = require('fs');
const Path = require('path');
const Http = require('http');
const Assert = require('assert');

const PORT = 8331;
const TARGET = 8332;
const TMP = Path.join(__dirname, 'tmp', 'index-fixes2');
const FRAMEWORK = require.resolve(process.env.FRAMEWORK || '../index');

var failed = false;

function check(name, ok, error) {
	console.log('[' + (ok ? 'OK' : 'FAIL') + ']', name);
	if (!ok) {
		console.log(error);
		failed = true;
	}
}

function finish(code) {
	try {
		Fs.rmSync(TMP, { recursive: true, force: true });
		Fs.rmSync(PATH.temp(F.clusterid + 'framework.cache'), { force: true });
	} catch (e) {}
	process.exit(code);
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, path, headers) {
	return new Promise(function(resolve) {
		var req = Http.request({ host: '127.0.0.1', port: PORT, method: method, path: path, headers: headers || {} }, function(res) {
			var body = [];
			res.on('data', chunk => body.push(chunk));
			res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(body).toString('utf8') }));
		});
		req.on('error', err => resolve({ status: 0, body: err.message }));
		req.end();
	});
}

Fs.mkdirSync(TMP, { recursive: true });

var script = `require(${JSON.stringify(FRAMEWORK)});
var worker = NEWTHREAD();
worker.message = function(msg) {
	if (msg === 'info')
		worker.send({ is: F.worker.is, isfork: F.worker.isfork });
	else if (msg === 'exit')
		worker.exit(0);
};`;

Fs.writeFileSync(Path.join(TMP, 'worker.js'), script);

var target = Http.createServer(function(req, res) {
	res.writeHead(200, { 'content-type': 'text/plain' });
	res.end('target:' + req.url);
});

var targetsocket = Http.createServer(function(req, res) {
	res.writeHead(200, { 'content-type': 'text/plain' });
	res.end('socket:' + req.url);
});

ROUTE('GET /proxy/', function() {
	this.res.proxy('http://127.0.0.1:' + TARGET + '/');
});

ROUTE('GET /proxy-socket/', function() {
	this.res.proxy(Path.join(TMP, 'target.socket'));
});

ROUTE('POST /api/cors/', function() {
	this.plain('cors');
});

CORS('/api/*', ['post', 'x-token']);

HTTP('release', { ip: '127.0.0.1', port: PORT });

function message(worker, msg) {
	return new Promise(function(resolve) {
		worker.once('message', resolve);
		worker.postMessage(msg);
	});
}

ON('ready', async function() {

	try {

		await new Promise(resolve => target.listen(TARGET, '127.0.0.1', resolve));
		await new Promise(resolve => targetsocket.listen(Path.join(TMP, 'target.socket'), resolve));

		// CACHE persistence
		F.cache.set2('fixes2_persistent', 'yes', '5 minutes');
		await wait(1500);
		var filename = PATH.temp(F.clusterid + 'framework.cache');
		var saved = Fs.existsSync(filename) ? Fs.readFileSync(filename, 'utf8').parseJSON() : null;
		check('F.cache.set2() writes the persistent item', saved && saved.fixes2_persistent && saved.fixes2_persistent.value === 'yes', 'saved: ' + JSON.stringify(saved));

		// CACHE.removeAll([])
		F.cache.set('fixes2_a', 1);
		F.cache.set('fixes2_b', 2);
		F.cache.set('fixes2_c', 3);
		var count = F.cache.removeAll(['fixes2_a']);
		check('F.cache.removeAll([...]) removes the matching keys only', count === 1 && F.cache.get('fixes2_b') === 2 && F.cache.get('fixes2_c') === 3 && F.cache.get('fixes2_a') === undefined, 'count: ' + count);

		// PROXY() with a unix socket (threads)
		var err = null;
		try {
			var proxy = PROXY('/fixes2-thread/', Path.join(TMP, 'socket'), 'replace', null, null, 5000);
		} catch (e) {
			err = e;
		}
		check('PROXY() with a unix socket and the threads arguments', !err && proxy.timeout === 5 && proxy.check == null, err);
		proxy && proxy.remove();

		// res.proxy()
		var res = await request('GET', '/proxy/');
		check('res.proxy() proxies the request', res.status === 200 && res.body === 'target:/proxy/', res.status + ' ' + res.body);

		res = await request('GET', '/proxy-socket/');
		check('res.proxy() proxies the request to a unix socket', res.status === 200 && res.body === 'socket:/proxy-socket/', res.status + ' ' + res.body);

		// CORS() header flags
		res = await request('OPTIONS', '/api/cors/', { origin: 'http://example.test', 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-token' });
		check('CORS() header flags allow the preflight request', res.status === 200 && res.headers['access-control-allow-origin'] === 'http://example.test', res.status + ' ' + JSON.stringify(res.headers));

		res = await request('POST', '/api/cors/', { origin: 'http://example.test', 'x-token': '123' });
		check('CORS() header flags allow the request', res.status === 200 && res.body === 'cors', res.status + ' ' + res.body);

		// Pools
		var name = '~' + Path.join(TMP, 'worker.js');

		var pool = NEWTHREADPOOL(name, 2);
		check('NEWTHREADPOOL() count', pool.count === 2, 'pool.count is ' + typeof(pool.count));

		var info = await message(pool.workers[0], 'info');
		check('F.worker in a thread', info.is === true && info.isfork === false, JSON.stringify(info));

		var lost = pool.workers[0];
		var kept = pool.workers[1];
		lost.terminate();
		await wait(500);
		check('NEWTHREADPOOL() replaces a lost worker', pool.workers.length === 2 && pool.workers.indexOf(lost) === -1 && pool.workers.indexOf(kept) !== -1, pool.workers.length);

		var replacement = pool.workers[1];
		var used = [];
		await new Promise(function(resolve) {
			var fn = function(worker) {
				used.push(worker);
				used.length === 2 && resolve();
			};
			pool.exec(fn);
			pool.exec(fn);
			setTimeout(resolve, 1000);
		});
		var executed = used.indexOf(replacement) !== -1;
		for (var w of used)
			w.release();
		check('NEWTHREADPOOL() uses the replaced worker', executed, 'used: ' + used.length);

		var forks = NEWTHREADPOOL(name, 1, true);
		info = await message(forks.workers[0], 'info');
		check('F.worker in a fork', info.is === true && info.isfork === true, JSON.stringify(info));

		for (var w of pool.workers)
			w.removeAllListeners('exit');
		for (var w of forks.workers)
			w.removeAllListeners('exit');
		for (var w of pool.workers)
			w.terminate();
		for (var w of forks.workers)
			w.kill('SIGKILL');

	} catch (e) {
		console.log('[FAIL]', e);
		finish(1);
	}

	finish(failed ? 1 : 0);
});
