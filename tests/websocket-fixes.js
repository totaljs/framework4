// WebSocket controller `secured` and the inline `&middleware` in the FILE and WebSocket routes.
//   cd tests && node websocket-fixes.js

require('../index');

const PORT = 8224;

HTTP('release', { ip: '127.0.0.1', port: PORT });

const Http = require('http');

const hits = [];

function check(name, ok, error) {
	console.log('[' + (ok ? 'OK' : 'FAIL') + ']', name);
	if (!ok) {
		console.log(error);
		process.exit(1);
	}
}

MIDDLEWARE('wsmark', function($) {
	hits.push('wsmark');
	$.next();
});

MIDDLEWARE('filemark', function($) {
	hits.push('filemark');
	$.next();
});

var secured;
var securederror;

ROUTE('SOCKET /wsfixes/ &wsmark', function() {
	var self = this;
	self.on('open', function(client) {
		try {
			secured = self.secured;
		} catch (e) {
			securederror = e;
		}
		client.send({ ok: true });
	});
});

ROUTE('FILE /filefixes/*.txt &filemark', function(req, res) {
	res.send(200, 'file', 'text/plain');
});

function get(path) {
	return new Promise(function(resolve) {
		Http.get('http://127.0.0.1:' + PORT + path, function(res) {
			var body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => resolve({ status: res.statusCode, body: body }));
		}).on('error', err => resolve({ status: 0, body: err.message }));
	});
}

function connect(path) {
	return new Promise(function(resolve) {
		var ws = new global.WebSocket('ws://127.0.0.1:' + PORT + path);
		var done = function(value) {
			try {
				ws.close();
			} catch (e) {}
			resolve(value);
		};
		ws.onmessage = e => done(e.data);
		ws.onerror = () => done(null);
		setTimeout(() => done(null), 3000);
	});
}

ON('ready', async function() {

	try {

		var route = F.routes.websockets.findItem(r => r.middleware && r.middleware.indexOf('wsmark') !== -1);
		check('WebSocket route: the inline middleware keeps its whole name', !!route, 'The middleware name was cut: ' + JSON.stringify(F.routes.websockets.map(r => r.middleware)));
		check('WebSocket route: the inline middleware is removed from the URL', route.urlraw === '/wsfixes/', 'The URL is: ' + route.urlraw);

		route = F.routes.files.findItem(r => r.middleware && r.middleware.indexOf('filemark') !== -1);
		check('FILE route: the inline middleware keeps its whole name', !!route, 'The middleware name was cut: ' + JSON.stringify(F.routes.files.map(r => r.middleware)));
		check('FILE route: the inline middleware is removed from the URL', route.urlraw === '/filefixes/*.txt', 'The URL is: ' + route.urlraw);

		var response = await get('/filefixes/test.txt');
		check('FILE route answers and runs its middleware', response.status === 200 && response.body === 'file' && hits.indexOf('filemark') !== -1, 'Status ' + response.status + ', middleware ' + JSON.stringify(hits));

		var message = await connect('/wsfixes/');
		check('WebSocket route connects and runs its middleware', !!message && hits.indexOf('wsmark') !== -1, 'Message ' + message + ', middleware ' + JSON.stringify(hits));
		check('WebSocket controller `secured` does not throw', !securederror, securederror && securederror.message);
		check('WebSocket controller `secured` is false over ws://', secured === false, 'secured is ' + secured);

	} catch (e) {
		console.log('[FAIL]', e);
		process.exit(1);
	}

	process.exit(0);
});
