exports.install = function() {

	ROUTE('SOCKET  /', main);
	ROUTE('SOCKET  /reconnect/', reconnect);
	ROUTE('+SOCKET /authorized/', simple);
	ROUTE('-SOCKET /unauthorized/', simple);

};

function reconnect() {

	var self = this;
	var disconnect_after = 2000;

	self.on('open', function(client, message) {
		setTimeout(function() {
			client.close();
		}, disconnect_after);
	});

}

function simple() {

	var self = this;

	self.on('message', function(client, message) {
		if (message.command === 'start')
			client.send({ command: 'close' });
	});

}

function main() {

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