require('../index');

WEBSOCKETCLIENT(function(client) {
	client.connect('ws://127.0.0.1:8000/$tms/');

	client.on('open', function() {
		client.subscribers = {};
		client.tmsready = true;
	});

	client.on('close', function() {
		client.tmsready = false;
	});

	client.on('message', function(msg) {
		switch (msg.type) {
			case 'meta':
				client.subscribers = {};
				for (var i = 0; i < msg.subscribers.length; i++) {
					var key = msg.subscribers[i];
					client.subscribers[key] = 1;
				}
				break;

			case 'subscribers':
				client.subscribers = {};
				for (var i = 0; i < msg.subscribers.length; i++) {
					var key = msg.subscribers[i];
					client.subscribers[key] = 1;
				}
				break;

			case 'publish':
				if (client.tmsready && client.subscribers[msg.id])
					client.send(msg);
				break;
		}
	});
});