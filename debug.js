// Copyright 2012-2021 (c) Peter Širka <petersirka@gmail.com>
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
 * @module FrameworkDebug
 * @version 4.0.0
 */

const Path = require('path');
const Fs = require('fs');
// const debugging = process.argv.indexOf('--watcher') !== -1;
const debugging = process.connected === true;
const Os = require('os');
const isWindows = Os.platform().substring(0, 3).toLowerCase() === 'win';

var first = process.argv.indexOf('--restart') === -1;
var options = null;
var initdelay;
var watchercallback;

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
	// options.cluster = 'auto' || or NUMBER
	// options.cluster_limit = 10;
	// options.timeout = 5000;
	// options.threads = '/api/' || or true or false;
	// options.thread = 'thread_name';
	// options.logs = 'isolated';

};

module.exports.watcher = function(callback) {
	initdelay && clearTimeout(initdelay);
	initdelay = null;
	watchercallback = callback;
	runwatching();
};

function runapp() {

	!options && (options = {});
	require('./index');

	if (options.https)
		HTTPS('debug', options);
	else
		HTTP('debug', options);

	if (first)
		EMIT('debug_start');
	else
		EMIT('debug_restart');
}

function runwatching() {

	!options && (options = {});
	require('./index');

	var directory = process.cwd();
	var directory_root = directory;
	const FILENAME = U.getName(process.argv[1] || 'index.js');
	const VERSION = F.version_header;
	const REG_CONFIGS = /configs\//g;
	const REG_FILES = /config-debug|config-release|config|versions|sitemap|\.js$|\.ts$|\.resource$|\.build$/i;
	const REG_THEMES = /\/themes\//i;
	const REG_PUBLIC = /\/public\//i;
	const REG_INDEX = new RegExp(FILENAME.replace(/\.js$/, '') + '_.*?\\.js$');
	const REG_COMPONENTS = /components\/.*?\.html|\.package\/.*?$/i;
	const REG_JSONSCHEMAS = /jsonschemas\/.*?\.json$/i;
	const REG_THEMES_INDEX = /themes(\/|\\)?[a-z0-9_.-]+(\/|\\)?index\.js$/i;
	const REG_EXTENSION = /\.(js|ts|resource|package|bundle|build)$/i;
	const REG_RELOAD = /\.(js|css|html|htm|jpg|png|gif|ico|svg|resource)$/i;
	const isRELOAD = !!options.livereload;
	const SPEED = isRELOAD ? 1000 : 1500;
	const ARGV = CLONE(process.argv);
	const PIDNAME = FILENAME.replace(/\.(js|ts)$/, '.pid');

	if (isRELOAD && typeof(options.livereload) === 'string')
		options.livereload = options.livereload.replace(/^(https|http):\/\//g, '');

	function copyFile(oldname, newname, callback) {
		var writer = Fs.createWriteStream(newname);
		callback && writer.on('finish', callback);
		Fs.createReadStream(oldname).pipe(writer);
	}

	function app() {

		if (!watchercallback) {
			global.OBSOLETE = NOOP;
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
		}

		var skipbundle = false;
		F.directory = directory;

		try {
			if (Fs.readFileSync(PATH.join(directory, 'bundles.debug'))) {
				skipbundle = true;
				F.directory = directory = PATH.join(directory, '.src');
			}

		} catch(e) {}

		const fork = require('child_process').fork;
		const directories = [
			Path.join(directory, CONF.directory_components),
			Path.join(directory, CONF.directory_controllers),
			Path.join(directory, CONF.directory_definitions),
			Path.join(directory, CONF.directory_operations),
			Path.join(directory, CONF.directory_modules),
			Path.join(directory, CONF.directory_models),
			Path.join(directory, CONF.directory_builds),
			Path.join(directory, CONF.directory_jsonschemas),
			Path.join(directory, CONF.directory_schemas),
			Path.join(directory, CONF.directory_tasks),
			Path.join(directory, CONF.directory_resources),
			Path.join(directory, CONF.directory_source),
			Path.join(directory, CONF.directory_workers),
			Path.join(directory, CONF.directory_packages),
			Path.join(directory, CONF.directory_themes),
			Path.join(directory, CONF.directory_configs),
			Path.join(directory, CONF.directory_bundles),
			Path.join(directory, '/startup/'),
			Path.join(directory, '/threads/'),
			Path.join(directory, '/plugins/')
		];

		if (global.THREAD)
			directories.push(Path.join(directory, '/threads/' + global.THREAD + '/'));

		const SRC = Path.join(directory, CONF.directory_src);
		const prefix = '--------> ';

		options.watch && options.watch.forEach(function(item) {
			if (item[0] === '/')
				item = item.substring(1);
			if (item[item.length - 1] === '/')
				item = item.substring(0, item.length - 1);
			directories.push(Path.join(directory, item));
		});

		var files = {};
		var force = false;
		var changes = [];
		var app = null;
		var status = watchercallback ? 1 : 0;
		var pid = '';
		var isLoaded = false;
		var isSkip = false;
		var isBUNDLE = false;
		var blacklist = {};
		var counter = 0;
		var WS = null;
		var speed = isRELOAD ? 1000 : 4000;

		blacklist['/' + PIDNAME] = 1;
		blacklist['/debug.pid'] = 1;
		blacklist['/debug.js'] = 1;
		blacklist['/bundle.json'] = 1;
		blacklist['/package.json'] = 1;
		blacklist['/readme.md'] = 1;

		if (isRELOAD && !watchercallback) {
			if (typeof(options.livereload) === 'string') {
				WEBSOCKETCLIENT(function(client) {
					client.options.type = 'text';
					client.on('open', function() {
						WS = client;
					});
					client.on('close', function() {
						WS = null;
					});
					client.connect('wss://livereload.totaljs.com/?hostname=' + encodeURIComponent(options.livereload));
				});
			} else {
				var tmppath = Path.join(Os.tmpdir(), 'total4livereload');
				Fs.mkdir(tmppath, function() {
					F.console = NOOP;
					WEBSOCKET('/', function() {
						var self = this;
						self.autodestroy(function() {
							WS = null;
						});
						WS = self;
					});
					HTTP('release', { port: typeof(options.livereload) === 'number' ? options.livereload : 35729, directory: tmppath });
				});
			}
		}

		if (skipbundle) {
			try {
				Fs.statSync(PATH.root(CONF.directory_bundles));
				isBUNDLE = true;
			} catch(e) {}
		}

		if (isBUNDLE || isRELOAD) {
			directories.push(Path.join(directory, CONF.directory_public));
			directories.push(Path.join(directory, CONF.directory_views));
		}

		function onFilter(path, isDirectory) {
			var p = path.substring(directory.length);
			if (isBUNDLE)
				return isDirectory ? SRC !== path : !blacklist[p];
			if (isRELOAD)
				return isDirectory ? true : REG_RELOAD.test(path);
			return isDirectory && REG_THEMES.test(path) ? true : isDirectory ? true : !REG_PUBLIC.test(path) && (REG_EXTENSION.test(path) || REG_COMPONENTS.test(path) || REG_JSONSCHEMAS.test(path) || REG_CONFIGS.test(path) || REG_THEMES_INDEX.test(path));
		}

		function onComplete(f) {

			Fs.readdir(directory, function(err, arr) {

				var length = arr.length;
				for (var i = 0; i < length; i++) {
					var name = arr[i];
					if (name !== FILENAME && !REG_INDEX.test(name) && REG_FILES.test(name))
						f.push(name);
				}

				length = f.length;

				for (var i = 0; i < length; i++) {
					var name = f[i];
					if (files[name] === undefined)
						files[name] = isLoaded ? 0 : null;
				}

				refresh();
			});
		}

		function livereload() {
			isRELOAD && setTimeout2('livereload', () => WS && WS.send(typeof(options.livereload) === 'string' ? options.livereload : 'reload'), 500);
		}

		function isViewPublic(filename) {

			if (!isBUNDLE && !isRELOAD)
				return false;

			var fn = filename.substring(directory.length);
			var index = fn.indexOf('/', 1);
			var dir = fn.substring(0, index + 1);

			if (dir === CONF.directory_themes) {
				index = fn.indexOf('/', index + 1);
				dir = fn.substring(index, fn.indexOf('/', index + 1) + 1);
			}

			return CONF.directory_views === dir || CONF.directory_public === dir ? fn : '';
		}

		function makestamp() {
			return '--- # --- [ ' + new Date().format('yyyy-MM-dd HH:mm:ss') + ' ] ';
		}

		function refresh() {
			var reload = false;
			Object.keys(files).wait(function(filename, next) {
				Fs.stat(filename, function(err, stat) {

					var stamp = makestamp();

					if (err) {
						delete files[filename];
						var tmp = isViewPublic(filename);
						var log = stamp.replace('#', 'REM') + prefix + normalize(filename.replace(directory, ''));
						if (tmp) {
							if (isBUNDLE) {
								Fs.unlinkSync(Path.join(SRC, tmp));
								console.log(log);
							}
							reload = true;
						} else {
							changes.push(log);
							force = true;
						}
					} else {

						var ticks = stat.mtime.getTime();

						if (files[filename] != null && files[filename] !== ticks) {

							if (filename.endsWith('.bundle') && files[filename.replace(/\.bundle$/, '.url')]) {
								// Bundle from URL address
								files[filename] = ticks;
								reload = true;
								next();
								return;
							}

							if (options.threads && filename.substring(directory.length).indexOf('/threads/') !== -1 && files[filename]) {
								files[filename] = ticks;
								next();
								return;
							}

							var log = stamp.replace('#', files[filename] === 0 ? 'ADD' : 'UPD') + prefix + normalize(filename.replace(directory, ''));
							if (files[filename]) {
								var tmp = isViewPublic(filename);
								if (tmp) {
									var skip = true;
									if (isBUNDLE) {
										if (filename.lastIndexOf('--') === -1)
											copyFile(filename, Path.join(SRC, tmp));
										else
											skip = false;
									}
									if (skip) {
										files[filename] = ticks;
										reload = true;
										next();
										return;
									}
								}
							}

							changes.push(log);
							force = true;
						}
						files[filename] = ticks;
					}

					next();
				});
			}, function() {

				isLoaded = true;

				if (status !== 1 || !force) {
					reload && livereload();
					if (counter % 150 === 0)
						speed = isRELOAD ? 3000 : 6000;
					setTimeout(refresh_directory, speed);
					return;
				}

				restart();
				counter = 0;
				speed = SPEED;
				setTimeout(refresh_directory, speed);

				var length = changes.length;
				for (var i = 0; i < length; i++)
					console.log(changes[i]);

				changes = [];
				force = false;
			}, 3);
		}

		function refresh_directory() {
			counter++;
			U.ls(directories, onComplete, onFilter);
		}

		function restart() {

			if (watchercallback) {
				if (first)
					first = false;
				else
					watchercallback(changes);
				return;
			}

			if (app !== null) {
				try
				{
					isSkip = true;
					process.kill(app.pid);
					if (options.inspector) {
						setTimeout(restart, 1000);
						return;
					}
				} catch (err) {}
				app = null;
			}

			var arr = ARGV.slice(2);
			var port = arr.pop();

			if (process.execArgv.indexOf('--debug') !== -1 || options.debugger) {
				var key = '--debug=' + (options.debugger || 40894);
				process.execArgv.indexOf(key) === -1 && process.execArgv.push(key);
			}

			if (process.execArgv.indexOf('--inspect') !== -1 || options.inspector) {
				var key = '--inspect=' + (options.inspector || 9229);
				process.execArgv.indexOf(key) === -1 && process.execArgv.push(key);
			}

			if (first)
				first = false;
			else
				arr.push('--restart');

			port && arr.push(port);
			app = fork(Path.join(directory_root, FILENAME), arr);

			app.on('message', function(msg) {
				switch (msg) {
					case 'total:eaddrinuse':
						process.exit(1);
						break;
					case 'total:restart':
						console.log(makestamp().replace('#', 'RES'));
						restart();
						break;
					case 'total:ready':
						if (status === 0) {
							app.send('total:debug');
							status = 1;
						}
						livereload();
						break;
				}
			});

			app.on('exit', function() {

				// checks unexpected exit
				if (isSkip === false) {
					app = null;
					process.exit();
					return;
				}

				isSkip = false;
				if (status === 255)
					app = null;
			});

			EMIT('watcher', app);
		}

		process.on('SIGTERM', end);
		process.on('SIGINT', end);
		process.on('exit', end);

		function end() {

			if (process.isending)
				return;

			process.isending = true;
			Fs.unlink(pid, noop);

			if (app === null) {
				process.exit(0);
				return;
			}

			isSkip = true;
			process.kill(app.pid);
			app = null;
			process.exit(0);
		}

		function noop() {}

		if (process.pid > 0) {

			!watchercallback && console.log(prefix.substring(8) + 'DEBUG PID: ' + process.pid + ' (v' + VERSION + ')');

			pid = Path.join(directory, PIDNAME);
			Fs.writeFileSync(pid, process.pid + '');

			setInterval(function() {
				Fs.stat(pid, function(err) {
					if (err) {
						Fs.unlink(pid, noop);
						if (app !== null) {
							isSkip = true;
							process.kill(app.pid);
						}
						process.exit(0);
					}
				});
			}, 4000);
		}

		restart();
		refresh_directory();
	}

	var filename = Path.join(process.cwd(), PIDNAME);
	if (Fs.existsSync(filename)) {
		Fs.unlinkSync(filename);
		setTimeout(app, 3500);
	} else
		app();
}

function normalize(path) {
	return isWindows ? path.replace(/\\/g, '/') : path;
}

function init() {

	if (options.cluster && !options.threads) {
		var cluster = options.cluster;
		delete options.cluster;
		require('total4').cluster.http(cluster, 'debug', options);
		return;
	}

	process.on('uncaughtException', e => e.toString().indexOf('ESRCH') == -1 && console.log(e));
	process.title = 'total: debug';

	if (debugging)
		setImmediate(runapp);
	else
		setImmediate(runwatching);
}

initdelay = setTimeout(init, 100);