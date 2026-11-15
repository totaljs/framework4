// Tests for the SQL QueryBuilder fixes: gridfields() and gridfilter() dates
require('../index');

const Assert = require('assert');

function builder() {
	return new QueryBuilderDB(true).find('users');
}

function last(b) {
	return b.filter[b.filter.length - 1];
}

try {

	var b, f, year = NOW.getFullYear();

	// gridfields(): fields are set when they match
	b = builder().gridfields('id,name,secret', 'id,name');
	Assert.deepStrictEqual(b.options.fields, ['id', 'name'], 'gridfields() with allowed fields');

	b = builder().gridfields('id,name');
	Assert.deepStrictEqual(b.options.fields, ['id', 'name'], 'gridfields() without allowed fields');

	// gridfields(): nothing matched, fields stay untouched
	b = builder().gridfields('secret', 'id,name');
	Assert.ok(!b.options.fields || !b.options.fields.length, 'gridfields() with no match');

	// gridfilter(): dot date DD.MM
	b = builder().gridfilter('dtcreated', { dtcreated: '5.12' }, Date);
	f = last(b);
	Assert.strictEqual(f.type, 'between', 'dot date type');
	Assert.strictEqual(f.a.getFullYear(), year, 'dot date year');
	Assert.strictEqual(f.a.getMonth(), 11, 'dot date 5.12 month');
	Assert.strictEqual(f.a.getDate(), 5, 'dot date 5.12 day');

	b = builder().gridfilter('dtcreated', { dtcreated: '25.3' }, Date);
	f = last(b);
	Assert.strictEqual(f.a.getMonth(), 2, 'dot date 25.3 month');
	Assert.strictEqual(f.a.getDate(), 25, 'dot date 25.3 day');

	// gridfilter(): year range
	b = builder().gridfilter('dtcreated', { dtcreated: '2020 - 2022' }, Date);
	f = last(b);
	Assert.strictEqual(f.type, 'between', 'year range type');
	Assert.strictEqual(f.a.getFullYear(), 2020, 'year range start year');
	Assert.strictEqual(f.a.getMonth(), 0, 'year range starts in January');
	Assert.strictEqual(f.a.getDate(), 1, 'year range starts on the 1st');
	Assert.strictEqual(f.b.getFullYear(), 2022, 'year range end year');
	Assert.strictEqual(f.b.getMonth(), 11, 'year range ends in December');
	Assert.strictEqual(f.b.getDate(), 31, 'year range ends on the 31st');

	// gridfilter(): dash date MM-DD still works
	b = builder().gridfilter('dtcreated', { dtcreated: '12-5' }, Date);
	f = last(b);
	Assert.strictEqual(f.a.getMonth(), 11, 'dash date month');
	Assert.strictEqual(f.a.getDate(), 5, 'dash date day');

} catch (e) {
	console.error('FAIL:', e.message);
	process.exit(1);
}

console.log('OK');
process.exit(0);
