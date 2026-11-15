// CALL().language() sets $.language for a new action and for a schema operation.
//   cd tests && node call-language.js

require('../index');

const Assert = require('assert');

function fail(err) {
	console.error('FAILED:', err);
	process.exit(1);
}

NEWACTION('CallLanguage/read', {
	name: 'Read language',
	action: function($) {
		$.callback($.language);
	}
});

NEWSCHEMA('CallLanguage', function(schema) {
	schema.setQuery(function($) {
		$.callback($.language);
	});
});

function call(name) {
	return new Promise((resolve, reject) => CALL(name).language('sk').callback((err, response) => err ? reject(err) : resolve(response)));
}

setTimeout(async function() {
	try {
		Assert.strictEqual(await call('-CallLanguage/read'), 'sk', 'NEWACTION');
		Assert.strictEqual(await call('-CallLanguage --> query'), 'sk', 'NEWSCHEMA');
	} catch (e) {
		fail(e);
	}
	console.log('OK');
	process.exit(0);
}, 500);
