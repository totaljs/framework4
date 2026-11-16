// Operations: $.DB() returns a QueryBuilder controller.
//   cd tests && node operations-db.js

require('../index');

const Assert = require('assert');

function fail(err) {
	console.error('FAILED:', err);
	process.exit(1);
}

NEWOPERATION('operations_db', function($) {
	var db;
	try {
		db = $.DB();
	} catch (e) {
		$.invalid(e.message);
		return;
	}
	$.callback(db && typeof(db.find) === 'function');
});

OPERATION('operations_db', {}, function(err, response) {
	try {
		Assert.ok(!err, 'OPERATION failed: ' + err);
		Assert.strictEqual(response, true, '$.DB() must return a DB() controller');
	} catch (e) {
		fail(e);
	}
	console.log('OK');
	process.exit(0);
});
