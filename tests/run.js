var assert = require('assert');
require('../index');

var url = 'http://0.0.0.0:8000';
var tests = [];

// RESTBuilder
tests.push(function(next) {

	var name = 'RESTBUILDER';
	var subtests = [];

	console.time(name);

	// HTML page
	subtests.push(function(next) {
		RESTBuilder.GET('https://www.totaljs.com').exec(function(err, res) {
			assert.ok(err === null && res === EMPTYOBJECT, name + ' - Expecting empty Object');
			next();
		});
	});

	// Invalid path
	subtests.push(function(next) {
		RESTBuilder.GET('https://www.totaljs.com/helfo').exec(function(err, res) {
			assert.ok(err === null && res === EMPTYOBJECT, name + ' - Expecting empty Object');
			next();
		});
	});

	// JSON
	subtests.push(function(next) {
		RESTBuilder.GET('https://www.totaljs.com/api/json/').exec(function(err, res) {
			assert.ok(err === null && res !== EMPTYOBJECT, name + ' - Expecting data');
			next();
		});
	});

	subtests.wait(function(item, next_subtest) {
		item(next_subtest);
	}, function() {
		console.timeEnd(name);
		next();
	});

});

// Routes
tests.push(function(next) {

	var name = 'ROUTES - ';
	var subtests = [];

	// Schema Names
	subtests.push(function(next) {
		var subname = name + 'Schema names';

		console.time(subname);

		var names = ['query', 'read', 'insert', 'update', 'patch', 'remove', 'delete', 'workflow'];
		names.wait(function(item, next) {
			RESTBuilder.GET(url + '/names/' + item).exec(function(err) {
				assert.ok(err === null, subname + item);
				next();
			});
		}, function() {
			console.timeEnd(subname);
			next();
		});
	});

	// Params
	subtests.push(function(next) {
		var subname = name + 'Params';

		console.time(subname);

		var item = 'hello1';
		var item2 = 'hello2';
		var item3 = 'hello3';
		var items = [
			{ url: `/${item}/`, res: item },
			{ url: `/params/${item}/`, res: item },
			{ url: `/params/alias/${item}/`, res: item },
			{ url: `/params/is/inside/${item}/long/route/`, res: item },
			{ url: `/params/is/inside/${item}/long/route/alias/`, res: item },
			{ url: `/params/${item}/${item2}/${item3}/alias/`, res: item },
			{ url: `/params/${item}/${item2}/${item3}/first`, res: item },
			{ url: `/params/${item}/${item2}/${item3}/second/`, res: item2 },
			{ url: `/params/${item}/${item2}/${item3}/third/`, res: item3 }
		];

		items.wait(function(item, next) {
			RESTBuilder.GET(url + item.url).exec(function(err, res) {
				assert.ok(res === item.res, subname + ' ' + item.url + ' - ' + item.res);
				next();
			});
		}, function() {
			console.timeEnd(subname);
			next();
		});
	});

	// Http request methods
	subtests.push(function(next) {
		var subname = name + 'Http request methods';
		var tests = [];

		console.time(subname);

		// All possible methods
		tests.push(function(next) {
			var methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/methods/').exec(function(err, res) {
					assert.ok(err === null && res.success, subname + ' - ' + method);
					next();
				});
			}, next);
		});

		// Wrong method - Path is correct but method is invalid
		tests.push(function(next) {
			RESTBuilder.POST(url + '/methods/wrong/').exec(function(err, res, output) {
				assert.ok(output.status === 404, subname + ' - Wrong method - Expecting error');
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, function() {
			console.timeEnd(subname);
			next();
		});

	});

	// X-Token
	subtests.push(function(next) {
		var subname = name + 'X-Token';

		var token = 'token123';
		RESTBuilder.GET(url + '/xtoken').header('x-token', token).exec(function(err, res) {
			assert.ok(res === token, subname);
			next();
		});

	});

	// Auth
	subtests.push(function(next) {
		var subname = name + 'Auth';
		var tests = [];

		console.time(subname);

		// Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 200 && res.success && res.value.user, subname + ' - Authorized user');
				next();
			});
		});

		// Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 200 && res.success, subname + ' - Unauthorized user');
				next();
			});
		});

		// Authorized route - Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/authorized/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 200 && res.success, subname + ' - Authorized route - Authorized user');
				next();
			});
		});

		// Authorized route - Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/authorized/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 401 && !res.success, subname + ' - Authorized route - Unauthorized user');
				next();
			});
		});

		// Unauthorized route - Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/unauthorized/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 401 && !res.success, subname + ' - Unauthorized route - Authorized user');
				next();
			});
		});

		// Unauthorized route - Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/unauthorized/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				assert.ok(output.status === 200 && res.success, subname + ' - Unauthorized route - Unauthorized user');
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, function() {
			console.timeEnd(subname);
			next();
		});

	});

	subtests.wait(function(item, next_subtest) {
		item(next_subtest);
	}, next);

});

// Schema
tests.push(function(next) {

	var name = 'SCHEMA - ';
	var subtests = [];

	// Formatting - Mostly string formattings
	subtests.push(function(next) {
		var subname = name + 'Formatting';

		console.time(subname);

		// Compare input and output values
		// i - input
		// o - output (expected)
		var data = {
			number: { i: 123, o: 123 },
			number_float: { i: 123.456789, o: 123.456789 },
			string: { i: 'HeLlO..@#$%%^&*!@#$%^&*(_+(123', o: 'HeLlO..@#$%%^&*!@#$%^&*(_+(123' },
			string_name: { i: 'firsť? lást123@$#', o: 'Firsť Lást' },
			string_capitalize: { i: 'camel časé1', o: 'Camel Časé1' },
			string_capitalize2: { i: 'only first', o: 'Only first' },
			string_lowercase: { i: 'LoWEr cAse', o: 'lower case' },
			string_uppercase: { i: 'UPper CaSe', o: 'UPPER CASE' }
		};

		// Assemble body object
		var body = {};
		for (var key in data) {
			body[key] = data[key].i;
		}

		RESTBuilder.POST(url + '/schema/formatting/', body).exec(function(err, res) {
			for (var key in data)
				assert.ok(res[key] === data[key].o, subname + ' - ' + key + ' - INPUT=' + data[key].i + ' OUTPUT=' + res[key] + ' EXPECTING=' + data[key].o);

			console.timeEnd(subname);
			next();
		});
	});

	// Valid values - Will crash if invalid (Make sure first row is filled completly, incompleted rows will be prefilled with it)
	var valid = [
		{ number: 123, email: 'abc@abc.abc', phone: '+421123456789', boolean: true, uid: UID(), url: 'https://www.google.com', object: {}, date: NOW, json: '{}' },
		{ number: 123.123456, email: 'abc@abc.abc', boolean: '1', url: 'http://www.google.com', date: new Date() },
		{ email: 'abc.abc@abc.abc', url: 'http://google.com' },
		{ url: 'https://google.com' }
	];

	// Intentionally invalid values - Will crash if valid (Make sure first row is filled completly, incompleted rows will be prefilled with it)
	var invalid = [
		{ number: 'abc', email: 'ca@.cz', phone: 'notphone', boolean: 'truee', uid: 'AV232CS@', url: 'url', date: 'today', json: null },
		{ number: 'one', email: '@', phone: '12345667', boolean: 'boolean', json: '' }
	];

	function prefill_undefined(arr) {
		// Prefill missing fields in rows if 'undefined' based on index 0 row
		for (var i = 0; i < arr.length; i++) {
			for (var key in arr[0]) {
				if (typeof arr[i][key] === 'undefined')
					arr[i][key] = arr[0][key];
			}
		}
	}

	prefill_undefined(valid);
	prefill_undefined(invalid);

	// Valid data (Required)
	subtests.push(function(next) {
		var subname = name + 'Valid data (Required)';

		console.time(subname);

		valid.wait(function(item, next) {
			RESTBuilder.POST(url + '/schema/required/', item).exec(function(err) {
				var items = [];
				if (err && err.items && err.items.length)
					items = err.items.map(i => i.name + '(' + item[i.name] + ')');

				assert.ok(!items.length, subname + ' - fields are not valid --> ' + items);

				next();
			});
		}, function() {
			console.timeEnd(subname);
			next();
		});
	});

	// Invalid data (Required)
	subtests.push(function(next) {
		var subname = name + 'Invalid data (Required)';

		console.time(subname);

		invalid.wait(function(item, next) {
			RESTBuilder.POST(url + '/schema/required/', item).exec(function(err) {

				// Remap
				var errors = [];
				if (err && err.items && err.items.length) {
					for (var i = 0; i < err.items.length; i++)
						errors.push(err.items[i].name);
				}

				// Check
				var keys = Object.keys(item);
				for (var i = 0; i < keys.length; i++)
					assert.ok(errors.includes(keys[i]), subname + ' - field was accepted --> ' + keys[i] + '(' + item[keys[i]] + ')');

				next();
			});
		}, function() {
			console.timeEnd(subname);
			next();
		});
	});

	// Invalid data (Not Required)
	subtests.push(function(next) {
		var subname = name + 'Invalid data (Not Required)';

		console.time(subname);

		invalid.wait(function(item, next) {
			RESTBuilder.POST(url + '/schema/notrequired/', item).exec(function(err, res, output) {

				var keys = Object.keys(item);
				for (var i = 0; i < keys.length; i++) {
					var default_value;
					var output = res[keys[i]];

					switch (keys[i]) {
						case 'string':
							default_value = '';
							break;

						case 'boolean':
							default_value = false;
							break;

						case 'date':
						case 'object':
							default_value = null;
							break;

						case 'number':
							default_value = 0;
							break;

						default:
							default_value = '';
							break;

					}

					assert.ok(output === default_value, subname + ' - field was not cleared --> ' + keys[i]);
				}

				next();
			});
		}, function() {
			console.timeEnd(subname);
			next();
		});
	});

	// Schema Chaining
	var data = { value: { one: 'one', two: 'two' } };

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/schema/chaining/one/', data).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === data.value.one, 'Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/schema/chaining/two/', data).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === data.value.two, 'Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, next);

});

tests.push(function(next) {

	var name = 'WEBSOCKET';
	var subtests = [];
	var test_message = 'message123';

	console.time(name);

	subtests.push(function(next) {

		// Events
		var open_timeout_duration = 2000;
		function open_failed() {
			assert(false, name + ' - Failed to emit on.open (timeout ' + open_timeout_duration + 'ms)');
		}

		var close_timeout_duration = 1000;
		function close_failed() {
			assert(false, name + ' - Failed to emit on.close (timeout ' + close_timeout_duration + 'ms)');
		}

		WEBSOCKETCLIENT(function(client) {

			var open_timeout, close_timeout;

			client.connect(url.replace('http', 'ws') + '?query=' + test_message);

			// If 'on.open' event is not triggered 1s after 'client.connect' then fail test
			open_timeout = setTimeout(open_failed, open_timeout_duration);

			client.on('open', function() {
				clearTimeout(open_timeout);
				client.send({ command: 'start' });
			});

			client.on('close', function() {
				clearTimeout(close_timeout);
				next();
			});

			client.on('error', function(e) {
				assert(false, name + ' error --> ' + e);
			});

			client.on('message', function(message) {

				switch (message.command) {
					case 'query':
						assert(message.data === test_message, name + ' - Returned query is not the same');
						client.headers['x-token'] = 'token-123';
						client.send({ command: 'headers' });
						break;

					case 'headers':
						assert(client.headers['x-token'] === 'token-123', name + ' - Returned X-Token is not the same');
						client.cookies['cookie'] = 'cookie-123';
						client.send({ command: 'cookies' });
						break;

					case 'cookies':
						assert(client.cookies['cookie'] === 'cookie-123', name + ' - Returned Cookie is not the same');
						client.options.compress = false;
						client.send({ command: 'options_uncompressed', data: test_message });
						break;

					case 'options_uncompressed':
						client.options.compress = true;
						assert(message.data === test_message, name + ' - Uncompressed message is not the same');
						client.send({ command: 'options_compressed', data: test_message });
						break;

					case 'options_compressed':
						assert(message.data === test_message, name + ' - Compressed message is not the same');
						client.options.command = 'binary';
						client.send(Buffer.from(JSON.stringify({ command: 'options_type_binary', data: test_message })));
						break;

					case 'options_type_binary':
						assert(message.data === test_message, name + ' - Binary message is not the same');
						client.options.type = 'json';
						client.send({ command: 'close' });
						break;

					case 'close':
						client.close();
						close_timeout = setTimeout(close_failed, close_timeout_duration);
						break;

					case 'error':
						assert(false, name + message.data.message);
						break;
				}
			});
		});
	});

	// Authorized socket - Authorized user
	subtests.push(function(next) {

		WEBSOCKETCLIENT(function(client) {

			client.cookies['auth'] = 'correct-cookie';
			client.connect(url.replace('http', 'ws') + '/authorized/');

			client.on('open', function() {
				client.send({ command: 'start' });
			});

			client.on('close', function() {
				next();
			});

			client.on('error', function(e) {
				assert(false, name + ' error --> ' + e);
			});

			client.on('message', function(message) {
				switch (message.command) {
					case 'close':
						client.close();
						break;
				}
			});
		});

	});

	// Unauthorized socket - Authorized user
	subtests.push(function(next) {

		WEBSOCKETCLIENT(function(client) {

			client.cookies['auth'] = 'correct-cookie';
			client.connect(url.replace('http', 'ws') + '/unauthorized/');

			client.on('error', function(e) {
				assert(true, name + ' error --> ' + e);
				next();
			});

		});

	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(name);
		next();
	});

});


tests.push(function(next) {

	var name = 'OPERATIONS';
	var subtests = [];

	console.time(name);

	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/success').exec(function(err, res) {
			assert.ok(err === null && res.success, name + ' - Rouote operation (success)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/invalid/').exec(function(err, res) {
			assert.ok(err !== null && !res.success, name + ' - Route operation (invalid)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/value/', { value: 'value' }).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === 'value', name + ' - Route operation (value)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/success/').exec(function(err, res) {
			assert.ok(err === null && !res.success, name + ' - Schema operation (value)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/schema/invalid/').exec(function(err, res) {
			assert.ok(err !== null && !res.success, name + ' - Schema operation (invalid)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/value/', { value: 'value' }).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === 'value', name + ' - Schema operation (value)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/stop/', { value: 'stop' }).exec(function(err, res) {
			assert.ok(err !== null && !res.success, name + ' - Schema operation (run stop)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/invalid/', { value: 'invalid' }).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === 'invalid', name + ' - Schema operation (run invalid)');
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/success/', { value: 'success' }).exec(function(err, res) {
			assert.ok(err === null && res.success && res.value === 'success', name + ' - Schema operation (run success)');
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(name);
		next();
	});

});

// Localization
tests.push(function(next) {

	var name = 'LOCALIZATION';
	var subtests = [];

	console.time(name);

	var regex = /<h1>(.*?)<\/h1>/;

	// Default (English)
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/en/').exec(function(err, res, output) {
			assert.ok(output.response.match(regex)[1] === 'Hello world!', `Expecting 'Hello world!'`);
			next();
		});
	});

	// Translated (Slovakian)
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/sk/').exec(function(err, res, output) {
			assert.ok(output.response.match(regex)[1] === 'Ahoj svet!', `Expecting 'Ahoj svet!'`);
			next();
		});
	});

	// Query string language
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/?lang=sk').exec(function(err, res, output) {
			assert.ok(output.response.match(regex)[1] === 'Ahoj svet!', `Expecting 'Ahoj svet!'`);
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(name);
		next();
	});

});

// Run
ON('ready', function() {
	console.time('Finished');
	run(1);
});

function run(counter) {

	if (counter > 10) {
		console.log('-----------------------------------');
		console.timeEnd('Finished');
		console.log('Happy coding!');
		console.log('-----------------------------------');
		console.log('');
		process.exit(0);
	}

	console.log('');
	console.log('-----------------------------------');
	console.log(' Round: ' + counter);
	console.log('-----------------------------------');

	tests.wait(function(item, next) {
		item(next);
	}, () => setTimeout(() => run(counter + 1), 500));

}

ON('error', function(e) {
	console.log(e);
	process.exit(1);
});