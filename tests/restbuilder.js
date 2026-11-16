// RESTBuilder: robot(), mobile(), error() and maxlength(), against a tiny HTTP server on 127.0.0.1.
//   cd tests && node restbuilder.js

require('../index');

const Assert = require('assert');
const Http = require('http');

const server = Http.createServer(function(req, res) {
	switch (req.url) {
		case '/ua':
			res.end(JSON.stringify({ ua: req.headers['user-agent'] }));
			break;
		case '/array':
			res.end('[1,2]');
			break;
		case '/empty':
			res.end('[]');
			break;
		case '/big':
			res.end(JSON.stringify({ data: 'x'.repeat(500000) }));
			break;
	}
});

function fail(err) {
	console.error('FAILED:', err);
	process.exit(1);
}

function exec(builder) {
	return new Promise(resolve => builder.exec((err, response, output) => resolve({ err: err, response: response, output: output })));
}

server.listen(0, '127.0.0.1', async function() {

	const url = 'http://127.0.0.1:' + server.address().port;

	try {

		// robot() and mobile() add a token to the default User-Agent
		var res = await exec(RESTBuilder.GET(url + '/ua').robot());
		Assert.strictEqual(res.response.ua, 'Total.js/v' + F.version_header + ' Bot', 'robot()');

		res = await exec(RESTBuilder.GET(url + '/ua').mobile());
		Assert.strictEqual(res.response.ua, 'Total.js/v' + F.version_header + ' iPhone', 'mobile()');

		// error(): a non-empty array is a valid response, an empty array is the error
		res = await exec(RESTBuilder.GET(url + '/array').error('empty'));
		Assert.ok(!res.err, 'error() with a non-empty array must not fail');
		Assert.deepStrictEqual(res.response, [1, 2]);

		res = await exec(RESTBuilder.GET(url + '/empty').error('empty'));
		Assert.ok(res.err, 'error() with an empty array must fail');

		// maxlength(): the body stops growing past the limit
		res = await exec(RESTBuilder.GET(url + '/big').maxlength(1000));
		Assert.ok(res.output.response.length < 500000, 'maxlength() must limit the body (' + res.output.response.length + ')');

	} catch (e) {
		fail(e);
	}

	console.log('OK');
	server.close();
	process.exit(0);
});
