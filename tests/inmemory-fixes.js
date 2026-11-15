// INMEMORY(): find2() in the reverse order, clean(), clear() and drop().
//   cd tests && node inmemory-fixes.js

require('../index');

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');

const DIR = Path.join(__dirname, 'tmp', 'inmemory-fixes');
const FILENAME = Path.join(DIR, 'databases', 'test.inmemory');

var errors = [];

process.on('uncaughtException', function(e) {
	errors.push(e);
});

function finish(e) {
	Fs.rmSync(DIR, { recursive: true, force: true });
	if (e) {
		console.error(e);
		process.exit(1);
	}
	console.log('OK');
	process.exit(0);
}

setTimeout(function() {
	finish(new Error('Timeout' + (errors.length ? ': ' + errors.join(', ') : '')));
}, 3000);

Fs.mkdirSync(Path.dirname(FILENAME), { recursive: true });
Fs.writeFileSync(FILENAME, JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]));

F.directory = DIR + '/';

var db = INMEMORY('test');

db.find2().callback(function(err, response) {
	try {
		Assert.deepStrictEqual(response.map(n => n.id), [3, 2, 1], 'find2() must return the items in the reverse order');
	} catch (e) {
		finish(e);
		return;
	}

	db.clean(function() {
		db.clear(function() {
			db.find().callback(function(err, response) {
				try {
					Assert.strictEqual(response.length, 0, 'clear() must remove all items');
				} catch (e) {
					finish(e);
					return;
				}
				db.drop().callback(function() {
					setTimeout(function() {
						try {
							Assert.strictEqual(Fs.existsSync(FILENAME), false, 'drop() must remove the file');
							Assert.strictEqual(errors.length, 0, 'no errors: ' + errors.join(', '));
						} catch (e) {
							finish(e);
							return;
						}
						finish();
					}, 100);
				});
			});
		});
	});
});
