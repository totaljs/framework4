var assert = require('assert');

exports.install = function() {

	ROUTE('SOCKET  /', socket);
	ROUTE('+SOCKET /authorized/', simple_socket);
	ROUTE('-SOCKET /unauthorized/', simple_socket);

};

function simple_socket() {

	var self = this;

	self.on('message', function(client, message) {
		if (message.command === 'start')
			client.send({ command: 'close' });
	});

}

function socket() {

	var self = this;
	var name = 'WEBSOCKET SERVER';

	self.on('open', function() {
		console.time(name);
	});

	self.on('close', function() {
		console.timeEnd(name);
	});

	self.on('message', function(client, message) {

		// Convert
		switch (message.type) {
			case 'Buffer':
				message = JSON.parse(Buffer.from(message.data));
				break;
		}

		// Commands
		switch (message.command) {

			case 'start':
				client.send({ command: 'query', data: client.query.query });
				break;

			case 'headers':
				client.send({ command: 'headers', data: client.headers['x-token'] });
				break;

			case 'cookies':
				client.send({ command: 'cookies', data: client.cookie('cookie') });
				break;

			case 'options_uncompressed':
				client.send({ command: 'options_uncompressed', data: message.data });
				break;

			case 'options_compressed':
				client.send({ command: 'options_compressed', data: message.data });
				break;

			case 'options_type_binary':
				client.send({ command: 'options_type_binary', data: message.data });
				break;

			case 'close':
				client.send({ command: 'close' });
				break;

			default:
				client.send({ command: 'error', data: 'Unhandled case' });
				break;

		}

	});

}