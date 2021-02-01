exports.install = function() {

	ROUTE('SOCKET /', socket);

}

function socket() {

	var self = this;

	self.on('open', function(client) {
		client.send({ type: 'message_1' });
	});

	self.on('close', function(client) {

	});

	self.on('message', function(client, message) {

		switch (message.type) {

			case 'close':
				client.send({ type: 'close' });
				break;

		}

	});

}