exports.install = function() {

	ROUTE('SOCKET /', socket);

};

function socket() {

	var self = this;

	self.on('open', function(client) {
		client.send({ command: 'query', data: client.query.query });
	});

	self.on('close', function() {

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