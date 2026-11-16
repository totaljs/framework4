// WebSocketClient.sendcustom() writes a text and a binary frame to the socket.
//   cd tests && node websocketclient-sendcustom.js

require('../index');

const Assert = require('assert');
const WebSocketClient = require('../websocketclient');

try {
	const written = [];
	const client = WebSocketClient.create();
	client.socket = { write: buffer => written.push(buffer) };
	client.closed = false;
	client.isClosed = false;
	client.deflate = false;

	client.istext = true;
	Assert.strictEqual(client.sendcustom('text', 'hello'), true, 'text');
	Assert.strictEqual(written.length, 1, 'text frame written');
	Assert.ok(written[0].toString('utf8').indexOf('hello') !== -1, 'text payload');

	client.istext = false;
	Assert.strictEqual(client.sendcustom('binary', Buffer.from('world')), true, 'binary');
	Assert.strictEqual(written.length, 2, 'binary frame written');
	Assert.ok(written[1].toString('utf8').indexOf('world') !== -1, 'binary payload');
} catch (e) {
	console.error(e);
	process.exit(1);
}

console.log('OK');
process.exit(0);
