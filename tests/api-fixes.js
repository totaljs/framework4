// API().done() and the TotalAPI evaluator with the output to a file path (the HTTP request is stubbed).
//   cd tests && node api-fixes.js

require('../index');

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Stream = require('stream');

var errors = [];

process.on('uncaughtException', function(e) {
	errors.push(e);
});

function fail(e) {
	try {
		Fs.unlinkSync(Path.join(__dirname, 'tmp', 'api-fixes.pdf'));
	} catch (err) {}
	console.error(e);
	process.exit(1);
}

function test_done(next) {
	NEWAPI('apifixes', function(opt, callback) {
		callback(null, { ok: true });
	});

	var $ = { invalid: fail };

	API('apifixes', 'test').done($, function(response) {
		setTimeout(function() {
			try {
				Assert.deepStrictEqual(response, { ok: true }, 'done() must pass the response');
				Assert.strictEqual(errors.length, 0, 'done() must not throw: ' + errors.join(', '));
			} catch (e) {
				fail(e);
			}
			next();
		}, 50);
	});
}

function test_totalapi_file(next) {

	// tests/tmp may have been removed by another test
	Fs.mkdirSync(Path.join(__dirname, 'tmp'), { recursive: true });
	var filename = Path.join(__dirname, 'tmp', 'api-fixes.pdf');

	CONF.allow_totalapi = true;

	// No real request to the Total.js API
	global.REQUEST = function(opt) {
		var stream = new Stream.Readable({ read: NOOP });
		setImmediate(function() {
			opt.callback(null, { status: 200, headers: { 'content-type': 'application/pdf' }, stream: stream });
			stream.push('PDF');
			stream.push(null);
		});
	};

	var timeout = setTimeout(function() {
		fail(new Error('TotalAPI with the output to a file path must call the callback' + (errors.length ? ': ' + errors.join(', ') : '')));
	}, 2000);

	API('TotalAPI', 'html2pdf', { html: '<b>Test</b>' }).output(filename).callback(function(err, response) {
		clearTimeout(timeout);
		try {
			Assert.strictEqual(err, null, 'TotalAPI must not return an error');
			Assert.strictEqual(response, filename, 'TotalAPI must return the file path');
			Assert.strictEqual(Fs.readFileSync(filename, 'utf8'), 'PDF', 'TotalAPI must write the file');
			Assert.strictEqual(errors.length, 0, 'TotalAPI must not throw: ' + errors.join(', '));
		} catch (e) {
			fail(e);
		}
		Fs.unlinkSync(filename);
		next();
	});
}

test_done(function() {
	test_totalapi_file(function() {
		console.log('OK');
		process.exit(0);
	});
});
