// String.count(), String.args() with a default value, U.set() with a function value and U.toURLEncode() with a date.
//   cd tests && node utils-fixes.js

require('../index');

const Assert = require('assert');

try {
	// String.prototype.count()
	Assert.strictEqual('aXaXa'.count('a'), 3, 'count() must count a match at the start');
	Assert.strictEqual('abab'.count('ab'), 2, 'count() must count every match');
	Assert.strictEqual('aaaa'.count('aa'), 2, 'count() must count non-overlapping matches');
	Assert.strictEqual('abc'.count('x'), 0, 'count() without a match');
	Assert.strictEqual('abc'.count(''), 0, 'count() with an empty text');

	// String.prototype.args(obj, def)
	Assert.strictEqual('{a}-{b}'.args({ a: 'x y' }, '?'), 'x y-?', 'args(obj, def) must use def and must not encode values');
	Assert.strictEqual('{a}-{b}'.args({ a: '<b>' }, 'html', '?'), '&lt;b&gt;-?', 'args(obj, \'html\', def) must use def');
	Assert.strictEqual('{a}'.args({ a: '<b>' }, 'html'), '&lt;b&gt;', 'args(obj, \'html\') must encode HTML');
	Assert.strictEqual('{a}'.args({ a: 'x y' }, true), 'x%20y', 'args(obj, true) must encode URL');

	// U.set() with a function value
	var obj = { a: { n: 5 } };
	U.set(obj, 'a.n', function(value) {
		return value + 1;
	});
	Assert.strictEqual(obj.a.n, 6, 'U.set() must pass the current value to the function');

	// U.toURLEncode() with a date
	var date = new Date(Date.UTC(2020, 0, 2, 3, 4, 5));
	Assert.strictEqual(U.toURLEncode({ d: date, n: 1 }), 'd=' + encodeURIComponent(date.toISOString()) + '&n=1', 'U.toURLEncode() must encode a date');
} catch (e) {
	console.error(e);
	process.exit(1);
}

console.log('OK');
process.exit(0);
