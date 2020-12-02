// Copyright 2012-2020 (c) Peter Širka <petersirka@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * @module FrameworkRelease
 * @version 4.0.0
 */

require('./index');

// Constants
const Fs = require('fs');

// Variables
var WATCHER = process.connected === true;
var options;
var app;
var firstinit = true;
var pidname;
var unexpectedexit = false;
var restarting;

module.exports = function(opt) {

	options = opt;
	// options.ip = '127.0.0.1';
	// options.port = parseInt(process.argv[2]);
	// options.unixsocket = require('path').join(require('os').tmpdir(), 'app_name');
	// options.config = { name: 'Total.js' };
	// options.https = { key: Fs.readFileSync('keys/agent2-key.pem'), cert: Fs.readFileSync('keys/agent2-cert.pem')};
	// options.sleep = 3000;
	// options.inspector = 9229;
	// options.debugger = 40894;
	// options.watch = ['adminer'];
	// options.livereload = true;
	// options.watcher = false;

	if (!WATCHER)
		WATCHER = process.argv.indexOf('--watcher') === -1 && !options.watcher;
};

function makestamp() {
	return '--- # --- [ ' + new Date().format('yyyy-MM-dd HH:mm:ss') + ' ] ';
}

function restart() {
	restarting && clearTimeout(restarting);
	restarting = setTimeout(runapp, 100);
}

function runapp() {

	restarting = null;

	var Fork = require('child_process').fork;
	var Fs = require('fs');
	var Path = require('path');
	var arr = CLONE(process.argv).slice(2);
	var port = arr.pop();
	var directory = process.cwd();

	if (!firstinit)
		arr.push('--restart');

	port && arr.push(port);

	var filename = U.getName(process.argv[1] || 'index.js');

	pidname = Path.join(directory, filename.replace(/\.js$/, '.pid'));
	app = Fork(require('path').join(process.cwd(), filename), arr);
	app.on('message', function(msg) {
		switch (msg) {
			case 'total:eaddrinuse':
				process.exit(1);
				break;
			case 'total:ready':
				if (firstinit) {
					app.send('total:debug');
					firstinit = false;
				}
				break;
			case 'total:restart':
				console.log(makestamp().replace('#', 'RES'));
				unexpectedexit = true;
				setTimeout(restart, 1000);
				process.kill(app.pid);
				app = null;
				break;
		}
	});

	Fs.writeFileSync(pidname, process.pid + '');

	app.on('exit', function() {
		// checks unexpected exit
		if (unexpectedexit === true)
			app = null;
		else
			restart();

		unexpectedexit = false;
	});

}
function init() {

	if (WATCHER) {

		delete options.watcher;

		if (options.https)
			HTTPS('release', options);
		else
			HTTP('release', options);

		return;
	}

	var end = function() {

		if (process.isending)
			return;

		process.isending = true;
		Fs.unlink(pidname, NOOP);

		if (app) {
			unexpectedexit = true;
			process.kill(app.pid);
			app = null;
		}

		process.exit(0);
	};

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
	console.log('-------- RELEASE PID: ' + process.pid + ' (v' + F.version_header + ')');
	process.on('uncaughtException', e => e.toString().indexOf('ESRCH') == -1 && console.log(e));
	process.title = 'total: release';
	process.on('SIGTERM', end);
	process.on('SIGINT', end);
	process.on('exit', end);

	setInterval(function() {
		Fs.stat(pidname, function(err) {
			if (err) {
				unexpectedexit = true;
				process.kill(app.pid);
				setTimeout(() => process.exit(0), 100);
			}
		});
	}, 4000);

	setImmediate(runapp);
}

setTimeout(init, 50);