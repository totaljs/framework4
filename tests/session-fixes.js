// SESSION(name, ondata) and session.clear() without arguments.
//   cd tests && node session-fixes.js

require('../index');

HTTP('release', { ip: '127.0.0.1', port: 8225 });

const Fs = require('fs');

function check(name, ok, error) {
	console.log('[' + (ok ? 'OK' : 'FAIL') + ']', name);
	if (!ok) {
		console.log(error);
		process.exit(1);
	}
}

function ondata(item, next) {
	next(null, { name: 'loaded' });
}

function ondata2(item, next) {
	next(null, { name: 'loaded2' });
}

ON('ready', async function() {

	try {

		var session = SESSION('sessionfixes', ondata);
		check('SESSION(name, ondata) sets the ondata delegate', session.ondata === ondata, 'ondata is ' + typeof(session.ondata));

		var again = SESSION('sessionfixes', ondata2);
		check('SESSION(name, ondata) of an existing session sets the ondata delegate', again === session && session.ondata === ondata2, 'ondata was not changed');

		var keep = SESSION('sessionfixes');
		check('SESSION(name) keeps the ondata delegate', keep.ondata === ondata2, 'ondata was removed');

		var def = SESSION(ondata);
		check('SESSION(ondata) uses the default session', def === SESSION('default') && def.ondata === ondata, 'The default session was not used');

		await new Promise(resolve => session.set('s1', 'u1', null, '5 minutes', resolve));
		await new Promise(resolve => session.set('s2', 'u2', null, '5 minutes', resolve));

		var count = await new Promise(resolve => session.clear((err, count) => resolve(count)));
		check('session.clear() returns the count of removed sessions', count === 2, 'count is ' + count);
		check('session.clear() removes the sessions', session.items.size === 0, 'size is ' + session.items.size);

	} catch (e) {
		console.log('[FAIL]', e);
		process.exit(1);
	}

	Fs.rmSync(PATH.databases('sessionssessionfixes.txt'), { force: true });
	Fs.rmSync(PATH.databases('sessionsdefault.txt'), { force: true });
	process.exit(0);
});
