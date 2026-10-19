// Mail attachments of the file of the storage and of a file, received by a tiny SMTP server that stands in for a real one.
//   cd tests && node mail-attachments.js

require('../index');

HTTP('release', { port: 8223 });

const Assert = require('assert');
const Net = require('net');
const Fs = require('fs');

CONF.mail_smtp = '127.0.0.1';
CONF.mail_smtp_options = { port: 2530 };
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

// The attachment with the name: its Base64 is decoded and the lines of the Base64 must be valid
function attachment(raw, name) {
	for (const part of raw.split(/\n--/)) {
		if (part.indexOf('filename="' + name + '"') === -1)
			continue;
		const lines = part.split('Content-Transfer-Encoding: base64\n\n')[1].split('\n').map(m => m.trim()).filter(m => m && m.indexOf('--') !== 0);
		return { data: Buffer.from(lines.join(''), 'base64'), valid: lines.every((m, i) => /^[A-Za-z0-9+/]*={0,2}$/.test(m) && (i === lines.length - 1 || m.indexOf('=') === -1)) };
	}
	return null;
}

function send(prepare) {
	return new Promise(function(resolve) {
		const before = received.length;
		const message = DEF.onMail('to@example.com', 'Attachment test', '<p>Hello</p>', function(err) {
			setTimeout(() => resolve({ err: err, raw: received[before] || null }), 300);
		});
		prepare(message);
	});
}

function check(name, ok, error) {
	console.log('[' + (ok ? 'OK' : 'FAIL') + ']', name);
	if (!ok) {
		console.log(error);
		process.exit(1);
	}
}

ON('ready', async function() {

	// A size that is not a multiple of 3 and of 68, with all the byte values
	const content = Buffer.alloc(100003);
	for (let i = 0; i < content.length; i++)
		content[i] = (i * 31 + (i >> 8)) & 255;

	await new Promise(resolve => server.listen(2530, '127.0.0.1', resolve));

	const file = PATH.temp('mail-attachment.bin');
	Fs.writeFileSync(file, content);

	let r = await send(m => m.attachment(file, 'file.bin'));
	let a = r.raw && attachment(r.raw, 'file.bin');
	check('attachment() with a file is sent without changes', a && a.valid && a.data.equals(content), 'The attachment is corrupted');

	await new Promise(resolve => FILESTORAGE('mailtest').save('f1', 'stored.bin', content, resolve));
	r = await send(m => m.attachmentfs('mailtest', 'f1', 'stored.bin'));
	a = r.raw && attachment(r.raw, 'stored.bin');
	check('attachmentfs() sends the file of the storage', a && a.valid && a.data.equals(content), 'The email was not sent with the attachment');

	await new Promise(resolve => FILESTORAGE('mailtest').save('f2', 'noname.bin', content, resolve));
	r = await send(m => m.attachmentfs('mailtest', 'f2'));
	a = r.raw && attachment(r.raw, 'noname.bin');
	check('attachmentfs() takes the name of the file when there is no name', a && a.data.equals(content), 'The name was not taken from the storage');

	r = await send(m => m.attachmentfs('mailtest', 'missing'));
	check('attachmentfs() with a missing file finishes the message', !!r.raw, 'The message was not completed');

	server.close();
	Fs.rmSync(PATH.temp(), { recursive: true, force: true });
	Fs.rmSync(PATH.databases('fs-mailtest'), { recursive: true, force: true });
	process.exit(0);
});
