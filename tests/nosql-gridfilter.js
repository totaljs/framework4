// NoSQL gridfilter(): dates in the DD.MM format and year ranges
//   cd tests && node nosql-gridfilter.js

require('../index');

const Assert = require('assert');

var failed = 0;

function check(name, fn) {
	try {
		fn();
		console.log('OK  ', name);
	} catch (e) {
		failed++;
		console.log('FAIL', name, e.message);
	}
}

function params(value) {
	var db = NOSQL('gridfilter_test').find();
	db.gridfilter('dt', { dt: value }, Date);
	return db;
}

function dates(db) {
	var output = [];
	var stack = [db];
	var text = JSON.stringify(db.options || db, function(key, val) {
		if (val instanceof Date)
			output.push(val);
		return val;
	});
	return output;
}

check('a year range starts on January 1', function() {
	var db = NOSQL('gridfilter_test').find();
	db.gridfilter('dt', { dt: '2020 - 2022' }, Date);
	var found = [];
	JSON.stringify(db, function(key, val) {
		if (typeof(val) === 'string' && (/^\d{4}-\d{2}-\d{2}T/).test(val))
			found.push(new Date(val));
		return val;
	});
	Assert.ok(found.length >= 2, 'no dates in the builder');
	Assert.strictEqual(found[0].getMonth(), 0);
	Assert.strictEqual(found[0].getDate(), 1);
	Assert.strictEqual(found[0].getFullYear(), 2020);
});

check('a DD.MM date is the day and the month', function() {
	var db = NOSQL('gridfilter_test').find();
	db.gridfilter('dt', { dt: '5.12 - 6.12' }, Date);
	var found = [];
	JSON.stringify(db, function(key, val) {
		if (typeof(val) === 'string' && (/^\d{4}-\d{2}-\d{2}T/).test(val))
			found.push(new Date(val));
		return val;
	});
	Assert.ok(found.length >= 2, 'no dates in the builder');
	Assert.strictEqual(found[0].getMonth(), 11);
	Assert.strictEqual(found[0].getDate(), 5);
});

setTimeout(function() {
	console.log(failed ? (failed + ' failed') : 'All tests passed');
	process.exit(failed ? 1 : 0);
}, 100);
