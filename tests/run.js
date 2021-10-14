require('../index');

const Assert = require('assert');
const Fs = require('fs');

const url = 'http://0.0.0.0:8000';
const rounds = 10;
const width = 50;
const tests = [];
const schema_methods = ['query', 'read', 'insert', 'update', 'patch', 'remove', 'workflow'];

function log(name, depth, is_last) {
	var str = ' ';
	for (var i = 0; i < depth; i++)
		str += '  ';
	if (depth > 0)
		str += is_last ? '└── ' : '├── ';
	return (str + name).padEnd(width - 12);
}

var subtest_name, subtest_log, test_name, test_log, others_name, others_log;

// RESTBuilder
tests.push(function(next) {

	var group = 'RESTBuilder';
	var group_log = log(group, 0, true);

	var subtests = [];

	console.log(group_log);

	// HTML page
	subtests.push(function(next) {
		subtest_name = 'HTML page';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET('https://www.totaljs.com').exec(function(err, res) {
			Assert.ok(err === null && res === EMPTYOBJECT, group + ' - Expecting empty Object');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Invalid path
	subtests.push(function(next) {
		subtest_name = 'Invalid route';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET('https://www.totaljs.com/helfo').exec(function(err, res) {
			Assert.ok(err instanceof ErrorBuilder, group + ' - Expecting ErrorBuilder');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Invalid path (local)
	subtests.push(function(next) {
		subtest_name = 'Invalid route (local)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET(url + '/not/existing/path').exec(function(err, res) {
			Assert.ok(err === null && res === EMPTYOBJECT, group + ' - Expecting empty Object');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// JSON
	subtests.push(function(next) {
		subtest_name = 'JSON';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET('https://www.totaljs.com/api/json/').exec(function(err, res) {
			Assert.ok(err === null && res !== EMPTYOBJECT, group + ' - Expecting data');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Sensitive case
	subtests.push(function(next) {
		subtest_name = 'Sensitive case';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET(url + '/uPperCase/').exec(function(err, res) {
			Assert.ok(err === null && res && res.success === true, group + ' - Uppercase - expecting success');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Route Middleware (success)
	subtests.push(function(next) {
		subtest_name = 'Middleware (success)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET(url + '/middleware/success/').exec(function(err, res) {
			Assert.ok(err === null && res && res.success === true, group + ' - Expecting success');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Route Middleware (invalid)
	subtests.push(function(next) {
		subtest_name = 'Middleware (invalid)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		RESTBuilder.GET(url + '/middleware/invalid/').exec(function(err, res, out) {
			Assert.ok(out.status === 400, group + ' - Expecting error');
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Middleware (F.use)
	subtests.push(function(next) {
		subtest_name = 'Middleware (F.use)';
		subtest_log = log(subtest_name, 1, true);
		console.time(subtest_log);

		function fail() {
			return Assert.fail('Middleware was not emited');
		}

		ON('fuse', () => clearTimeout(timeout_fail));

		F.use('middleware-fuse', '/middleware/fuse');

		var timeout_fail = setTimeout(fail, 1000);

		RESTBuilder.GET(url + '/middleware/fuse/').exec(function(err, res) {
			Assert.ok(err === null && res && res.success, group + ' - Expecting success');
			console.timeEnd(subtest_log);
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, next);

});

// Routes
tests.push(function(next) {

	var name = 'Routes';
	var name_log = log(name, 0, true);
	var subtests = [];

	console.log(name_log);

	// Params
	subtests.push(function(next) {
		subtest_name = 'Params';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var item = 'HELLO';
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
				Assert.ok(res === item.res, subtest_name + ' ' + item.url + ' - ' + item.res);
				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Http request methods
	subtests.push(function(next) {
		subtest_name = 'HTTP request methods';
		subtest_log = log(subtest_name, 1, true);
		console.log(subtest_log);

		var tests = [];

		// All possible methods
		tests.push(function(next) {
			test_name = 'All possible methods';
			test_log = log(test_name, 2);
			console.time(test_log);

			var methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/methods/').exec(function(err, res) {
					Assert.ok(err === null && res.success, subtest_name + ' - ' + method);
					next();
				});
			}, function() {
				console.timeEnd(test_log);
				next();
			});
		});

		// Method data validation
		tests.push(function(next) {
			test_name = 'Method data validation';
			test_log = log(test_name, 2);
			console.time(test_log);

			var methods = [{ name: 'GET', validate: false }, { name: 'POST', validate: true }, { name: 'PUT', validate: true }, { name: 'PATCH', validate: false }, { name: 'DELETE', validate: false }];

			methods.wait(function(method, next) {
				RESTBuilder[method.name](url + '/schema/methods/validation/').exec(function(err, res) {
					if (method.validate)
						Assert.ok(err !== null && !res.success, subtest_name + ' - Method ' + method.name + ' should validate data');
					else
						Assert.ok(err === null && res.success, subtest_name + ' - Method ' + method.name + ' shouldn\'t validate data');

					next();
				});
			}, function() {
				console.timeEnd(test_log);
				next();
			});
		});

		// PATCH / DELETE with validation (invalid)
		tests.push(function(next) {
			test_name = 'PATCH / DELETE (invalid)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var methods = ['PATCH', 'DELETE'];

			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/schema/methods/validation/', { email: 'not_email' }).exec(function(err, res) {
					Assert.ok(err !== null && !res.success, subtest_name + ' - Method ' + method + ' should return error');
					next();
				});
			}, function() {
				console.timeEnd(test_log);
				next();
			});
		});

		// PATCH / DELETE with validation (valid)
		tests.push(function(next) {
			test_name = 'PATCH / DELETE (valid)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var methods = ['PATCH', 'DELETE'];

			methods.wait(function(method, next) {
				RESTBuilder[method](url + '/schema/methods/validation/', { email: 'abc@abc.abc' }).exec(function(err, res) {
					Assert.ok(err === null && res.success, subtest_name + ' - Method ' + method + ' should\'t return error');
					next();
				});
			}, function() {
				console.timeEnd(test_log);
				next();
			});
		});

		// PATCH / DELETE - $.keys
		tests.push(function(next) {
			test_name = 'PATCH / DELETE ($.keys)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var methods = ['PATCH', 'DELETE'];
			var data = { valid: 'valid', valid_required: 'required' };

			methods.wait(function(method, next) {
				RESTBuilder.PATCH(url + '/schema/patchkeys/', data).exec(function(err, res) {

					Assert.ok(err === null && res.success && res.value, subtest_name + ' - Shouldn\'t return error');
					var value = res.value;

					for (var i = 0; i < value.keys.length; i++) {
						var item = value.keys[i];
						Assert.ok(data[item], subtest_name + ' - Key must be included');
						Assert.ok(data[item] === value.model[item], subtest_name + ' - Values are not the same');
					}

					next();

				});
			}, function() {
				console.timeEnd(test_log);
				next();
			});
		});

		// PATCH - EXEC
		tests.push(function(next) {
			test_name = 'PATCH - EXEC';
			test_log = log(test_name, 2);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			EXEC('#Schema/PatchKeys --> exec', data, function(err, res) {

				Assert.ok(err === null && res.success && res.value, subtest_name + ' - Shouldn\'t return error');

				var keys = res.value.keys;
				Assert.ok(keys.includes('valid'), subtest_name + ' - Key must be included');
				Assert.ok(!keys.includes('invalid'), subtest_name + ' - Key must be not included');

				var model = res.value.model;
				Assert.ok(model.valid === data.valid, subtest_name + ' - Model must be included');
				Assert.ok(model.invalid !== data.invalid, subtest_name + ' - Model must be not included');

				console.timeEnd(test_log);
				next();

			});
		});

		// Wrong method - Path is correct but method is invalid
		tests.push(function(next) {
			test_name = 'Wrong method';
			test_log = log(test_name, 2, true);
			console.time(test_log);

			RESTBuilder.POST(url + '/methods/wrong/').exec(function(err, res, output) {
				Assert.ok(output.status === 404, subtest_name + ' - Wrong method - Expecting error');
				console.timeEnd(test_log);
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, next);

	});

	// X-Token
	subtests.push(function(next) {
		subtest_name = 'X-Token';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var token = 'token123';
		RESTBuilder.GET(url + '/xtoken').header('x-token', token).exec(function(err, res) {
			Assert.ok(res === token, subtest_name + ' is not as expected');
			console.timeEnd(subtest_log);
			next();
		});

	});

	// Auth
	subtests.push(function(next) {
		subtest_name = 'Auth';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var tests = [];

		// Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 200 && res.success && res.value.user, subtest_name + ' - Authorized user');
				next();
			});
		});

		// Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 200 && res.success, subtest_name + ' - Unauthorized user');
				next();
			});
		});

		// Authorized route - Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/authorized/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 200 && res.success, subtest_name + ' - Authorized route - Authorized user');
				next();
			});
		});

		// Authorized route - Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/authorized/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 401 && !res.success, subtest_name + ' - Authorized route - Unauthorized user');
				next();
			});
		});

		// Unauthorized route - Authorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/unauthorized/').cookie('auth', 'correct-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 401 && !res.success, subtest_name + ' - Unauthorized route - Authorized user');
				next();
			});
		});

		// Unauthorized route - Unauthorized user
		tests.push(function(next) {
			RESTBuilder.GET(url + '/auth/unauthorized/').cookie('auth', 'wrong-cookie').exec(function(err, res, output) {
				Assert.ok(output.status === 200 && res.success, subtest_name + ' - Unauthorized route - Unauthorized user');
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});

	});

	// Wildcards
	subtests.push(function(next) {
		subtest_name = 'Wildcards';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var tests = [];

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 1, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/wild').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 1, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/wild/wild/wild').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 1, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/wild/wild').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 1, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/wild/wild/wild').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 1, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/second/arg1/arg2/wild').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 5, subtest_name);
				next();
			});
		});

		// Overwrite wildcard
		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/overwrite').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 2, subtest_name);
				next();
			});
		});

		tests.push(function(next) {
			RESTBuilder.POST(url + '/wildcards/overwrite/overwrite').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 3, subtest_name);
				next();
			});
		});

		// Previously created route, but longer (wildcard)
		tests.push(function(next) {
			RESTBuilder.GET(url + '/params/1/2/3/third/wild/').exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === 4, subtest_name);
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});

	});

	// API Routes
	subtests.push(function(next) {
		subtest_name = 'API Routes';
		subtest_log = log(subtest_name, 1, true);
		console.log(subtest_log);

		var route_path = '/v1/';
		var tests = [];

		// Basic
		tests.push(function(next) {
			test_name = 'Basic';
			test_log = log(test_name, 2);
			console.time(test_log);

			RESTBuilder.API(url + route_path, 'api_basic').exec(function(err, res) {
				Assert.ok(err === null && res.success, subtest_name + ' - ' + test_name);
				console.timeEnd(test_log);
				next();
			});
		});

		// Data validation (+)
		tests.push(function(next) {
			test_name = 'Validation (+)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			RESTBuilder.API(url + route_path, 'api_validation', data).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value && res.value.valid === data.valid, subtest_name + ' - ' + test_name + ' - cannot be error');
				Assert.ok(res.value.invalid !== data.invalid, subtest_name + ' - ' + test_name + ' - cannot be returned');
				console.timeEnd(test_log);
				next();
			});
		});

		// Without data validation (-)
		tests.push(function(next) {
			test_name = 'Validation (-)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			RESTBuilder.API(url + route_path, 'api_novalidation', data).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value && res.value.valid !== data.valid, subtest_name + ' - ' + test_name + ' - cannot be returned');
				Assert.ok(res.value.invalid !== data.invalid, subtest_name + ' - ' + test_name + ' - cannot be returned');
				console.timeEnd(test_log);
				next();
			});
		});

		// Patch validation (#)
		tests.push(function(next) {
			test_name = 'Patch validation (#)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			RESTBuilder.API(url + route_path, 'api_patch', data).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value.valid === data.valid, subtest_name + ' - cannot be error');
				Assert.ok(res.value.invalid !== data.invalid, subtest_name + ' - ' + test_name + ' - cannot be returned');
				console.timeEnd(test_log);
				next();
			});
		});

		// Patch Keys
		tests.push(function(next) {
			test_name = 'Patch keys';
			test_log = log(test_name, 2, true);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			RESTBuilder.API(url + route_path, 'api_keys', data).exec(function(err, res) {
				Assert.ok(err === null && res.success, subtest_name + ' - cannot be error');
				Assert.ok(res.value.includes('valid'), subtest_name + ' - cannot be error');
				Assert.ok(!res.value.includes('invalid'), subtest_name + ' - cannot be returned');

				console.timeEnd(test_log);
				next();
			});
		});

		// Patch Keys - Multioperation
		tests.push(function(next) {
			test_name = 'Patch keys (multioperation)';
			test_log = log(test_name, 2);
			console.time(test_log);

			var data = { valid: 'valid', invalid: 'invalid' };

			RESTBuilder.API(url + route_path, 'api_keys_multi', data).exec(function(err, res) {
				Assert.ok(!err && res && res.value && res.value.includes(data.valid) && !res.value.includes(data.invalid), subtest_name + ' - PATCH - Multiple operation keys');

				console.timeEnd(test_log);
				next();
			});
		});

		// Run
		tests.wait(function(item, next) {
			item(next);
		}, next);

	});

	subtests.wait(function(item, next) {
		item(next);
	}, next);

});

// Schema
tests.push(function(next) {
	var group_name = 'Schemas';
	var group_log = log(group_name, 0);

	console.log(group_log);

	var subtests = [];

	// Schema methods (GET)
	subtests.push(function(next) {
		subtest_name = 'Methods (GET)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		schema_methods.wait(function(item, next) {
			RESTBuilder.GET(url + '/schema/methods/' + item, { value: 'value' }).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value.value !== 'value', subtest_name + item);
				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Schema methods (POST)
	subtests.push(function(next) {
		subtest_name = 'Methods (POST)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		schema_methods.wait(function(item, next) {
			RESTBuilder.POST(url + '/schema/methods/' + item, { value: 'value' }).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value.value === 'value', subtest_name + item);
				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Formatting - Mostly string formattings
	subtests.push(function(next) {
		subtest_name = 'Formatting';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

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
				Assert.ok(res[key] === data[key].o, subtest_name + ' - ' + key + ' - INPUT=' + data[key].i + ' OUTPUT=' + res[key] + ' EXPECTING=' + data[key].o);

			console.timeEnd(subtest_log);
			next();
		});
	});

	// Valid values - Will crash if invalid (Make sure first row is filled completly, incompleted rows will be prefilled with it)
	var valid = [
		{ number: 123, email: 'abc@abc.abc', phone: '+421123456789', boolean: true, uid: UID(), url: 'https://www.totaljs.com', object: {}, date: NOW, json: '{}' },
		{ number: 123.123456, email: 'abc@abc.abc', boolean: '1', url: 'http://www.totaljs.com', date: new Date() },
		{ email: 'abc.abc@abc.abc', url: 'http://totaljs.com' },
		{ url: 'https://totaljs.com' }
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
		subtest_name = 'Valid data (Required)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		valid.wait(function(item, next) {
			RESTBuilder.POST(url + '/schema/required/', item).exec(function(err) {
				var items = [];
				if (err && err.items && err.items.length)
					items = err.items.map(i => i.name + '(' + item[i.name] + ')');

				Assert.ok(!items.length, subtest_name + ' - fields are not valid --> ' + items);

				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Invalid data (Required)
	subtests.push(function(next) {
		subtest_name = 'Invalid data (Required)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

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
					Assert.ok(errors.includes(keys[i]), subtest_name + ' - field was accepted --> ' + keys[i] + '(' + item[keys[i]] + ')');

				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Invalid data (Not Required)
	subtests.push(function(next) {
		subtest_name = 'Invalid data (Not Required)';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

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

					Assert.ok(output === default_value, subtest_name + ' - field was not cleared --> ' + keys[i]);
				}

				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});
	});

	// Schema chaining
	var data = { value: { one: 'one', two: 'two' } };

	others_name = 'Others';
	others_log = log(others_name, 1, true);

	subtests.push(function(next) {
		console.time(others_log);
		RESTBuilder.POST(url + '/schema/chaining/one/', data).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === data.value.one, others_name + ' Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
			next();
		});
	});

	subtests.push(function(next) {
		RESTBuilder.POST(url + '/schema/chaining/two/', data).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === data.value.two, others_name + 'Chaining failed - expecting \'{0}\' got \'{1}\' instead'.format(data.value.one, res.value));
			next();
		});
	});

	// Schema extensions
	subtests.push(function(next) {
		subtest_name = 'Extensions';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		schema_methods.wait(function(item, next) {
			RESTBuilder.GET(url + '/schema/extensions/' + item).exec(function(err, res) {
				Assert.ok(err === null && res.success && res.value === item + '_extended', subtest_name + ' - expecting \'{0}\' got \'{1}\' instead'.format(item + '_extended', res.value));
				next();
			});
		}, function() {
			console.timeEnd(subtest_log);
			next();
		});

	});

	// Schema filters
	subtests.push(function(next) {
		subtest_name = 'Filters';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var data = { string: 'string', number: 123, float: 123.456789, email: 'abc@abc.abc', phone: '+421123456789', boolean: true, uid: UID(), url: 'https://www.totaljs.com', date: +NOW.format('YYYYmmDD'), json: '{}' };

		RESTBuilder.POST(QUERIFY(url + '/schema/filters/', data)).exec(function(err, res) {

			Assert.ok(err === null && res.success && res.value, subtest_name + 'Schema filters failed in response');

			for (var key in res.value)
				Assert.ok(typeof res.value[key] === typeof data[key], subtest_name + 'Schema filters expecting {0} got {1} instead'.format(typeof res.value[key], typeof data[key]));

			console.timeEnd(subtest_log);
			next();
		});
	});

	// Schema verify - Valid
	subtests.push(function(next) {
		var data = { countryid: 'sk' };

		RESTBuilder.POST(url + '/schema/verify/', data).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value.countryid === data.countryid, others_name + 'Schema verify is not as expected');
			next();
		});
	});

	// Schema verify - Invalid
	subtests.push(function(next) {
		var data = { countryid: 'hu' };

		RESTBuilder.POST(url + '/schema/verify/', data).exec(function(err, res) {
			Assert.ok(err !== null && !res.success, others_name + 'Schema verify returned value (It shouldn\'t)');
			next();
		});
	});

	// Schena middleware - Valid
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/schema/middleware/valid/').exec(function(err, res) {
			Assert.ok(err === null && res.success, others_name + 'Schema middleware should return success');
			next();
		});
	});

	// Schena middleware - Invalid
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/schema/middleware/invalid/').exec(function(err, res) {
			Assert.ok(err !== null && !res.success, others_name + 'Schema middleware should return error');
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(others_log);
		next();
	});

});

tests.push(function(next) {

	var group_name = 'Websocket client';
	var group_log = log(group_name, 0);
	var subtests = [];
	var test_message = 'message123';

	console.log(group_log);

	subtests.push(function(next) {
		subtest_name = 'Basic';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		// Events
		var open_timeout_duration = 2000;
		function open_failed() {
			Assert.ok(false, subtest_name + ' - Failed to emit on.open (timeout ' + open_timeout_duration + 'ms)');
		}

		var close_timeout_duration = 1000;
		function close_failed() {
			Assert.ok(false, subtest_name + ' - Failed to emit on.close (timeout ' + close_timeout_duration + 'ms)');
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
				console.timeEnd(subtest_log);
				next();
			});

			client.on('error', function(e) {
				Assert.ok(false, subtest_name + ' error --> ' + e);
			});

			client.on('message', function(message) {

				switch (message.command) {
					case 'query':
						Assert.ok(message.data === test_message, subtest_name + ' - Returned query is not the same');
						client.headers['x-token'] = 'token-123';
						client.send({ command: 'headers' });
						break;

					case 'headers':
						Assert.ok(client.headers['x-token'] === 'token-123', subtest_name + ' - Returned X-Token is not the same');
						client.cookies['cookie'] = 'cookie-123';
						client.send({ command: 'cookies' });
						break;

					case 'cookies':
						Assert.ok(client.cookies['cookie'] === 'cookie-123', subtest_name + ' - Returned Cookie is not the same');
						client.options.compress = false;
						client.send({ command: 'options_uncompressed', data: test_message });
						break;

					case 'options_uncompressed':
						client.options.compress = true;
						Assert.ok(message.data === test_message, subtest_name + ' - Uncompressed message is not the same');
						client.send({ command: 'options_compressed', data: test_message });
						break;

					case 'options_compressed':
						Assert.ok(message.data === test_message, subtest_name + ' - Compressed message is not the same');
						client.options.command = 'binary';
						client.send(Buffer.from(JSON.stringify({ command: 'options_type_binary', data: test_message })));
						break;

					case 'options_type_binary':
						Assert.ok(message.data === test_message, subtest_name + ' - Binary message is not the same');
						client.options.type = 'json';
						client.send({ command: 'close' });
						break;

					case 'close':
						client.close();
						close_timeout = setTimeout(close_failed, close_timeout_duration);
						break;

					case 'error':
						Assert.ok(false, subtest_name + message.data);
						break;
				}
			});
		});
	});

	// Authorized socket - Authorized user
	subtests.push(function(next) {
		subtest_name = 'Authorized';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		WEBSOCKETCLIENT(function(client) {

			client.cookies['auth'] = 'correct-cookie';
			client.connect(url.replace('http', 'ws') + '/authorized/');

			client.on('open', function() {
				client.send({ command: 'start' });
			});

			client.on('close', function() {
				console.timeEnd(subtest_log);
				next();
			});

			client.on('error', function(e) {
				Assert.ok(false, subtest_name + ' error --> ' + e);
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
		subtest_name = 'Unauthorized';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		WEBSOCKETCLIENT(function(client) {

			client.options.reconnect = 0;
			client.cookies['auth'] = 'correct-cookie';
			client.connect(url.replace('http', 'ws') + '/unauthorized/');

			client.on('error', function(e) {
				Assert.ok(true, subtest_name + ' error --> ' + e);
				console.timeEnd(subtest_log);
				next();
			});

			client.on('close', function(e) {
				Assert.ok(true, subtest_name + ' error --> ' + e);
				console.timeEnd(subtest_log);
				next();
			});

		});

	});

	// WEBSOCKETCLIENT reconnect - Forced disconnect from server and client attempts to reconnect back + send test message after reconnect
	subtests.push(function(next) {
		subtest_name = 'Reconnect';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var connect_count = 0;

		function reconnect_fail() {
			return Assert.ok(false, subtest_name + ' - WEBSOCKET failed to reconnect');
		}

		function message_fail() {
			return Assert.ok(false, subtest_name + ' - WEBSOCKET failed to send message after reconnect');
		}

		WEBSOCKETCLIENT(function(client) {

			var reconnect_timeout, message_timeout;

			client.options.reconnect = 1000;
			client.connect(url.replace('http', 'ws') + '/reconnect/');

			client.on('open', function() {
				clearTimeout(reconnect_timeout);
				message_timeout = setTimeout(message_fail, 2000);
				client.send({ type: 'ping' });
				connect_count++;
			});

			client.on('message', function(message) {
				if (message.type === 'ping')
					clearTimeout(message_timeout);
			});

			client.on('close', function() {
				reconnect_timeout = setTimeout(reconnect_fail, 5000);

				if (connect_count > 1) {
					clearTimeout(reconnect_timeout);
					client.close();
					console.timeEnd(subtest_log);
					next();
				}
			});

		});

	});

	// Websocket - middleware
	subtests.push(function(next) {

		subtest_name = 'Middleware';
		subtest_log = log(subtest_name, 1, true);
		console.time(subtest_log);

		function middleware_fail() {
			return Assert.fail(subtest_name + ' - failed to emit');
		}

		WEBSOCKETCLIENT(function(client) {

			client.connect(url.replace('http', 'ws') + '/middleware/');

			var middleware_timeout;

			client.on('open', function() {
				middleware_timeout = setTimeout(middleware_fail, 1000);
				client.send({ type: 'ping' });
			});

			ON('socket_middleware_close', function() {
				setTimeout(() => client.close(), 500);
			});

			client.on('close', function() {
				OFF('socket_middleware_close');
				clearTimeout(middleware_timeout);
				console.timeEnd(subtest_log);
				next();
			});

		});

	});

	subtests.wait(function(item, next) {
		item(next);
	}, next);

});


tests.push(function(next) {
	var group_name = 'Operations';
	var group_log = log(group_name, 0, true);
	var subtests = [];

	console.time(group_log);

	// Route operation - success
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/success').exec(function(err, res) {
			Assert.ok(err === null && res.success, group_name + ' - Route operation (success)');
			next();
		});
	});

	// Route operation - invalid
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/invalid/').exec(function(err, res) {
			Assert.ok(err !== null && !res.success, group_name + ' - Route operation (invalid)');
			next();
		});
	});

	// Route operation - value
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/value/', { value: 'value' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === 'value', group_name + ' - Route operation (value)');
			next();
		});
	});

	// Route operation - multiple - one
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/multiple/one/', { value: 'success' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value !== 'success', group_name + ' - Route operation (multiple - one)');
			next();
		});
	});

	// Route operation - multiple - two
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/multiple/two/', { value: 'success' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === 'success', group_name + ' - Route operation (multiple - two)');
			next();
		});
	});

	// Schema operations - success
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/success/').exec(function(err, res) {
			Assert.ok(err === null && !res.success, group_name + ' - Schema operation (value)');
			next();
		});
	});

	// Schema operations - invalid
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/operations/schema/invalid/').exec(function(err, res) {
			Assert.ok(err !== null && !res.success, group_name + ' - Schema operation (invalid)');
			next();
		});
	});

	// Schema operations - value
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/value/', { value: 'value' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === 'value', group_name + ' - Schema operation (value)');
			next();
		});
	});

	// Schema operations - run - stop
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/stop/', { value: 'stop' }).exec(function(err, res) {
			Assert.ok(err !== null && !res.success, group_name + ' - Schema operation (run - stop)');
			next();
		});
	});

	// Schema operations - run - invalid
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/invalid/', { value: 'invalid' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === 'invalid', group_name + ' - Schema operation (run - invalid)');
			next();
		});
	});

	// Schema operations - run - success
	subtests.push(function(next) {
		RESTBuilder.POST(url + '/operations/schema/run/success/', { value: 'success' }).exec(function(err, res) {
			Assert.ok(err === null && res.success && res.value === 'success', group_name + ' - Schema operation (run - success)');
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(group_log);
		next();
	});

});

// Localization
tests.push(function(next) {

	var group_name = 'Localization';
	var group_log = log(group_name, 0, true);
	var subtests = [];
	var regex = /<h1>(.*?)<\/h1>/;

	console.time(group_log);

	// Default (English)
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/en/').exec(function(err, res, output) {
			Assert.ok(output.response.match(regex)[1] === 'Hello world!', `Expecting 'Hello world!'`);
			next();
		});
	});

	// Translated (Slovak)
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/sk/').exec(function(err, res, output) {
			Assert.ok(output.response.match(regex)[1] === 'Ahoj svet!', `Expecting 'Ahoj svet!'`);
			next();
		});
	});

	// Query string language
	subtests.push(function(next) {
		RESTBuilder.GET(url + '/localization/?lang=sk').exec(function(err, res, output) {
			Assert.ok(output.response.match(regex)[1] === 'Ahoj svet!', `Expecting 'Ahoj svet!'`);
			next();
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, function() {
		console.timeEnd(group_log);
		next();
	});

});

// Upload
tests.push(function(next) {

	var group_name = 'Upload';
	var group_log = log(group_name, 0);
	var subtests = [];

	console.log(group_log);

	// File upload with body
	subtests.push(function(next) {
		subtest_name = 'With body';
		subtest_log = log(subtest_name, 1);
		console.time(subtest_log);

		var filename = 'symbols.txt';

		Fs.readFile(filename, function(err, buffer) {
			if (err) throw err;

			RESTBuilder.POST(url + '/upload/', { value: 'value' }).file(filename.split('.')[0], PATH.root(filename)).exec(function(err, res, output) {
				Assert.ok(err === null && res.success && res.value.files[0] === buffer.toString() && res.value.value === 'value', subtest_name + ' - Recieved file content is not the same');
				console.timeEnd(subtest_log);
				next();
			});

		});
	});

	// Multiple upload
	subtests.push(function(next) {
		subtest_name = 'Multiple';
		subtest_log = log(subtest_name, 1, true);
		console.time(subtest_log);

		var filenames = ['symbols.txt', 'important.txt'];
		var buffers = [];

		filenames.wait(function(file, next) {
			// Get buffers from files
			Fs.readFile(file, function(err, data) {
				if (err) throw err;

				buffers.push(data);
				next();
			});
		}, function() {
			var builder = RESTBuilder.POST(url + '/upload/', { value: 'value' });

			// Append files to builder
			for (var i = 0; i < buffers.length; i++)
				builder = builder.file(filenames[i].split('.')[0], PATH.root(filenames[i]));

			builder.exec(function(err, res) {
				for (var i = 0; i < buffers.length; i++)
					Assert.ok(err === null && res.success && res.value.files[i] === buffers[i].toString(), subtest_name + ' - Recieved content of files are not the same');
				console.timeEnd(subtest_log);
				next();
			});
		});
	});

	subtests.wait(function(item, next) {
		item(next);
	}, next);

});


// Run
ON('ready', function() {
	console.time('	Finished');
	run(1);
});

function run(counter) {

	if (counter > rounds) {

		console.log('');
		console.log(''.padEnd(width, '═'));
		console.log('');
		console.timeEnd('	Finished');
		console.log('	Happy coding!');
		console.log('');
		console.log(''.padEnd(width, '═'));
		console.log('');
		process.exit(0);
	}

	console.log('');

	console.log('╔' + ''.padStart(width, '═') + '╗');
	console.log(('║' + ' Round: ' + counter + '/' + rounds).padEnd(width + 1) + '║');
	console.log('╚' + ''.padStart(width, '═') + '╝');

	tests.wait(function(item, next) {
		item(next);
	}, () => setTimeout(() => run(counter + 1), 500));

}

ON('error', function(e) {
	console.log(e);
	process.exit(1);
});