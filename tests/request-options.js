// REQUEST() options limit, redirects and nocookies, against a tiny local HTTP server.
//   cd tests && node request-options.js

require('../index');

const Assert = require('assert');
const Http = require('http');

const PORT = 8224;
const BASE = 'http://127.0.0.1:' + PORT;

const server = Http.createServer(function(req, res) {
	var m = req.url.match(/^\/redirect\/(\d+)$/);
	if (m) {
		var n = +m[1];
		res.writeHead(302, { location: n ? '/redirect/' + (n - 1) : '/ok', 'set-cookie': 'step' + n + '=1; path=/' });
		res.end();
		return;
	}
	if (req.url === '/big') {
		res.writeHead(200, { 'content-type': 'text/plain' });
		res.write(Buffer.alloc(1000, 'a'));
		setTimeout(function() {
			res.end(Buffer.alloc(100000, 'b'));
		}, 50);
		return;
	}
	res.writeHead(200, { 'content-type': 'text/plain' });
	res.end('cookie:' + (req.headers.cookie || ''));
});

function request(opt) {
	return new Promise(function(resolve) {
		opt.callback = function(err, response) {
			resolve({ err: err, response: response });
		};
		REQUEST(opt);
	});
}

server.listen(PORT, '127.0.0.1', async function() {
	try {
		var r;

		// Default: at most 3 redirects are followed
		r = await request({ url: BASE + '/redirect/5' });
		Assert.strictEqual(r.err, 'Too many redirects', 'default redirect limit');

		// redirects
		r = await request({ url: BASE + '/redirect/5', redirects: 10 });
		Assert.ok(!r.err, 'redirects: 10 must follow 6 redirects, got: ' + r.err);
		Assert.ok(r.response.body.indexOf('cookie:') === 0, 'redirects: body');
		Assert.ok(r.response.body.indexOf('step0=1') !== -1, 'cookies are transferred by default');

		// nocookies
		r = await request({ url: BASE + '/redirect/1', nocookies: true });
		Assert.ok(!r.err, 'nocookies: ' + r.err);
		Assert.strictEqual(r.response.body, 'cookie:', 'nocookies must not transfer cookies');

		// limit
		r = await request({ url: BASE + '/big', limit: 500 });
		Assert.ok(r.response.body.length < 101000, 'limit must stop reading the body, got ' + r.response.body.length + ' bytes');

		r = await request({ url: BASE + '/big' });
		Assert.strictEqual(r.response.body.length, 101000, 'without limit the whole body is read');

		console.log('OK');
		server.close();
		process.exit(0);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
});
