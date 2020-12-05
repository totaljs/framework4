require('../index');

var messages = 0;
var now;

WEBSOCKETCLIENT(function(client) {

	now = Date.now();

	console.log('Reconnect', new Date().format('HH:mm:ss'));
	client.options.type = 'json';
	client.options.masking = true;
	client.options.compress = false;
	client.options.reconnect = 5000;
	client.connect('ws://10.8.0.3:9090');

	client.on('open', function() {
		console.log('OPEN');
		client.send({"type":"ae_drone_control/Battery","topic":"/ae_drone_control/battery/state","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"std_msgs/UInt16","topic":"/ae_drone_control/t265/confidence","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"geometry_msgs/PoseStamped","topic":"/ae_drone_control/global_position/local","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"ae_drone_control/QrDetection","topic":"/ae_drone_control/qr/detected","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"ae_drone_control/DroneState","topic":"/ae_drone_control/drone/state","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"sensor_msgs/CompressedImage","topic":"/ae_drone_control/qr/color/compressed","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"std_msgs/Int16","topic":"/ae_drone_control/target/reach","throttle_rate":500,"queue_length":1,"op":"subscribe"});
		client.send({"type":"ae_drone_control/ErrorList","topic":"/ae_drone_control/error_manager/error_list","throttle_rate":500,"queue_length":1,"op":"subscribe"});
	});

	client.on('close', function() {
		var diff = Date.now() - now;
		console.log('CLOSE');
		console.log((diff / 60000).floor(3), 'min.');
	});
	client.on('error', function() {
		var diff = Date.now() - now;
		console.log('ERROR');
		console.log((diff / 60000).floor(3), 'min.');
	});

	client.on('message', function() {
		messages++;
	});

});

setInterval(function() {
	var diff = Date.now() - now;
	console.log((diff / 60000).floor(3), 'min. / ' + messages);
}, 60000);