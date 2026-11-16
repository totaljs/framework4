// Step values in the cron: `*/n` matches values divisible by n, `a/n` matches a, a+n, a+2n...
//   cd tests && node cron.js

require('../utils');

const Assert = require('assert');
const Cron = require('../cron');

function minutes(line) {
	const fn = Cron.make(line);
	const output = [];
	for (let i = 0; i < 60; i++) {
		if (fn(new Date(2024, 0, 1, 10, i)))
			output.push(i);
	}
	return output;
}

function hours(line) {
	const fn = Cron.make(line);
	const output = [];
	for (let i = 0; i < 24; i++) {
		if (fn(new Date(2024, 0, 1, i, 0)))
			output.push(i);
	}
	return output;
}

try {
	Assert.deepStrictEqual(minutes('*/15 * * * *'), [0, 15, 30, 45], '*/15 minutes');
	Assert.deepStrictEqual(minutes('*/20 * * * *'), [0, 20, 40], '*/20 minutes');
	Assert.deepStrictEqual(minutes('5/20 * * * *'), [5, 25, 45], '5/20 minutes');
	Assert.deepStrictEqual(hours('0 */6 * * *'), [0, 6, 12, 18], '*/6 hours');
	Assert.deepStrictEqual(hours('0 2/8 * * *'), [2, 10, 18], '2/8 hours');

	// Other field types still work
	Assert.deepStrictEqual(minutes('10-12 * * * *'), [10, 11, 12], 'between');
	Assert.deepStrictEqual(minutes('1,30 * * * *'), [1, 30], 'in');
	Assert.deepStrictEqual(minutes('7 * * * *'), [7], 'equal');
	Assert.strictEqual(minutes('* * * * *').length, 60, 'every minute');
} catch (e) {
	console.error(e);
	process.exit(1);
}

console.log('OK');
process.exit(0);
