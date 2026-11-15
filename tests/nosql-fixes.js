// NoSQL builder: hour()/minute(), log(), gridfields(), autoquery() and relation().
//   cd tests && node nosql-fixes.js

require('../index');

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');

const DIR = Path.join(__dirname, 'tmp', 'nosql-fixes');

F.directory = __dirname;
CONF.directory_databases = '/tmp/nosql-fixes/';

Fs.rmSync(DIR, { recursive: true, force: true });

const db = NOSQL('fixes');
const tests = [];

function test(name, fn) {
	tests.push({ name: name, fn: fn });
}

function find(builder) {
	return new Promise(function(resolve, reject) {
		builder.callback(function(err, response) {
			err ? reject(err) : resolve(response);
		});
	});
}

function insert(builder) {
	return new Promise(function(resolve) {
		builder.callback(() => resolve());
	});
}

test('hour() filters by the hour of a date', async function() {
	var response = await find(db.find().hour('dt', 10));
	Assert.deepStrictEqual(response.map(item => item.id), [1]);
});

test('minute() filters by the minute of a date', async function() {
	var response = await find(db.find().minute('dt', 45));
	Assert.deepStrictEqual(response.map(item => item.id), [2]);
});

test('log() appends to the .log file of the database', async function() {
	var builder = db.find();
	builder.log({ user: 'test' });
	await find(builder);
	await new Promise(resolve => setTimeout(resolve, 200));
	var filename = Path.join(DIR, 'fixes.nosql.log');
	Assert.ok(Fs.existsSync(filename), 'missing ' + filename);
	Assert.strictEqual(JSON.parse(Fs.readFileSync(filename, 'utf8').trim()).user, 'test');
});

test('gridfields() keeps the allowed fields', async function() {
	var builder = db.find();
	builder.gridfields('name,unknown', 'name,age');
	Assert.strictEqual(builder.options.fields, 'name');
	var response = await find(builder.sort('name_asc'));
	Assert.deepStrictEqual(response, [{ name: 'A' }, { name: 'B' }]);
});

test('autoquery() sorts with the direction and keeps multiple fields', async function() {
	var builder = db.find();
	builder.autoquery({ sort: 'age_desc,name_asc' }, 'name:string,age:number');
	Assert.strictEqual(builder.options.sort, 'age_desc,name_asc');
	var response = await find(builder);
	Assert.deepStrictEqual(response, [{ name: 'B', age: 7 }, { name: 'A', age: 5 }]);
});

test('relation() reads and writes its own file', async function() {
	await insert(db.insert({ id: 3, name: 'C' }).relation('tags', 'u1'));
	var related = await find(db.find().relation('tags', 'u1'));
	Assert.deepStrictEqual(related, [{ id: 3, name: 'C' }]);
	var main = await find(db.find());
	Assert.deepStrictEqual(main.map(item => item.id), [1, 2]);
});

async function run() {
	await insert(db.insert({ id: 1, name: 'A', age: 5, dt: new Date(2020, 1, 1, 10, 30) }));
	await insert(db.insert({ id: 2, name: 'B', age: 7, dt: new Date(2020, 1, 1, 11, 45) }));

	var failed = 0;
	for (var item of tests) {
		try {
			await Promise.race([item.fn(), new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), 3000))]);
			console.log('OK   ' + item.name);
		} catch (e) {
			failed++;
			console.log('FAIL ' + item.name + ': ' + e.message);
		}
	}

	Fs.rmSync(DIR, { recursive: true, force: true });
	console.log(failed ? (failed + ' failed') : 'All tests passed');
	process.exit(failed ? 1 : 0);
}

run();
