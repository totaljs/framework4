// Mail fixes: priority and sensitivity headers, the Total.js API path and the callbacks of several messages, received by a tiny SMTP server that stands in for a real one.
//   cd tests && node mail-fixes.js

require('../index');

HTTP('release', { port: 8224 });

const Assert = require('assert');
const Net = require('net');

CONF.mail_smtp = '127.0.0.1';
CONF.mail_smtp_options = { port: 2531 };
CONF.mail_from = 'from@example.com';

const received = [];

const server = Net.createServer(function(socket) {
	let data = false;
	let buffer = '';
	let current = '';
	socket.write('220 localhost ready\r\n');
	socket.on('data', function(chunk) {
		buffer += chunk.toString('utf8');
		let index;
		while ((index = buffer.indexOf('\r\n')) !== -1) {
			const line = buffer.substring(0, index);
			buffer = buffer.substring(index + 2);
			if (data) {
				if (line === '.') {
					data = false;
					received.push(current);
					current = '';
					socket.write('250 queued\r\n');
				} else
					current += line + '\n';
				continue;
			}
			const command = line.substring(0, 4).toUpperCase();
			if (command === 'EHLO' || command === 'HELO')
				socket.write('250 localhost\r\n');
			else if (command === 'DATA') {
				data = true;
				socket.write('354 go on\r\n');
			} else if (command === 'QUIT') {
				socket.write('221 bye\r\n');
				socket.end();
			} else
				socket.write('250 ok\r\n');
		}
	});
});

function create(subject) {
	return Mail.create(subject, '<p>Hello</p>').from('from@example.com').to('to@example.com');
}

// Resolves with the arguments of the callback or with null after a timeout (a callback that is never called)
function sendone(message) {
	return new Promise(function(resolve) {
		const timeout = setTimeout(() => resolve(null), 1000);
		message.manually().send2(function(err) {
			clearTimeout(timeout);
			resolve({ err: err });
		});
	});
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function headers(raw) {
	return raw ? raw.split('\n\n')[0] : '';
}

// The framework catches the uncaught exceptions, so a failed assertion must end the process here
function check(name, fn) {
	try {
		fn();
		console.log('[OK]', name);
	} catch (e) {
		console.log('[FAIL]', name);
		console.log(e.message);
		process.exit(1);
	}
}

ON('ready', async function() {

	await new Promise(resolve => server.listen(2531, '127.0.0.1', resolve));

	// high(), low(), confidential()
	let before = received.length;
	await sendone(create('High').high().confidential());
	await wait(300);
	check('high() and confidential() add the headers', function() {
		const h = headers(received[before]);
		Assert.ok(h.indexOf('X-Priority: 1') !== -1, 'Missing X-Priority: 1');
		Assert.ok(h.indexOf('Sensitivity: Company-Confidential') !== -1, 'Missing Sensitivity');
	});

	before = received.length;
	await sendone(create('Low').low());
	await wait(300);
	check('low() adds the header', function() {
		const h = headers(received[before]);
		Assert.ok(h.indexOf('X-Priority: 5') !== -1, 'Missing X-Priority: 5');
		Assert.ok(h.indexOf('Sensitivity') === -1, 'Unexpected Sensitivity');
	});

	// Several messages in one send: the callback is called once, for the last message
	let calls = [];
	const batch = [create('B1'), create('B2'), create('B3')];
	before = received.length;
	Mail.send(CONF.mail_smtp, CONF.mail_smtp_options, batch, (err, res) => calls.push({ err: err, res: res, count: received.length - before }));
	await wait(800);
	check('the callback of several messages is called once after the last message', function() {
		Assert.strictEqual(received.length - before, 3, 'Not all messages were sent');
		Assert.strictEqual(calls.length, 1, 'The callback was called ' + calls.length + ' times');
		Assert.ok(!calls[0].err, 'Unexpected error');
		Assert.ok(calls[0].count >= 2, 'The callback was called after the message ' + (calls[0].count + 1));
	});

	// A reused SMTP connection (mail_smtp_keepalive): every send2() calls its callback
	calls = [];
	for (let i = 0; i < 3; i++) {
		const m = create('K' + i).manually();
		m.send2(err => calls.push({ i: i, err: err }));
		await wait(400);
	}
	check('send2() on a reused connection calls every callback', function() {
		Assert.deepStrictEqual(calls.map(m => m.i), [0, 1, 2], 'Called callbacks: ' + JSON.stringify(calls.map(m => m.i)));
	});

	// A reused connection with a batch queued while another batch is sent
	calls = [];
	before = received.length;
	const a = [create('A1'), create('A2')];
	const b = [create('B1'), create('B2')];
	Mail.send(CONF.mail_smtp, CONF.mail_smtp_options, a, err => calls.push('a'), CONF.mail_smtp_keepalive);
	Mail.send(CONF.mail_smtp, CONF.mail_smtp_options, b, err => calls.push('b'), CONF.mail_smtp_keepalive);
	await wait(800);
	check('two batches on a reused connection call both callbacks once', function() {
		Assert.strictEqual(received.length - before, 4, 'Not all messages were sent');
		Assert.deepStrictEqual(calls, ['a', 'b']);
	});

	// The Total.js API (stubbed, no request is made)
	const api = global.TotalAPI;
	let sent = null;
	global.TotalAPI = function(token, type, data, callback) {
		sent = { token: token, type: type, data: data };
		setImmediate(() => callback(null, { success: true }));
	};
	CONF.allow_totalapi = true;
	CONF.mail_api = 'token123';
	let messagecb = 0;
	await sendone(create('API').high().confidential().callback(() => messagecb++));
	await wait(50);
	global.TotalAPI = api;
	CONF.mail_api = null;
	check('the Total.js API gets the sender, the priority and calls the callbacks', function() {
		Assert.ok(sent, 'TotalAPI was not called');
		Assert.strictEqual(sent.type, 'mail');
		Assert.strictEqual(sent.token, 'token123');
		Assert.strictEqual(sent.data.from, 'from@example.com', 'from: ' + sent.data.from);
		Assert.strictEqual(sent.data.priority, 1, 'priority: ' + sent.data.priority);
		Assert.strictEqual(sent.data.confidential, true);
		Assert.strictEqual(messagecb, 1, 'The callback of the message was called ' + messagecb + ' times');
	});

	server.close();
	process.exit(0);
});
