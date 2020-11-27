require('../index');

const Fs = require('fs');
var flow = FLOWSTREAM(); // is same as FLOWSTREAM('default');

flow.register('uppercase', function(instance) {

	instance.message = function(msg) {
		msg.data = msg.data.toUpperCase();
		// sends transformed data to output "0"
		msg.send('0');
	};

});

flow.register('reverse', function(instance) {

	instance.message = function(msg) {

		var arr = msg.data.split('');
		arr.reverse();
		msg.data = arr.join('');
		// sends transformed data to output "0"
		msg.send('0');
	};

});

flow.register('debug', function(instance) {

	instance.message = function(msg) {

		console.log(msg.data);

		// Ends message
		msg.end();
	};

});

flow.add('scheduler', Fs.readFileSync('flow_scheduler.html').toString('utf8'));

flow.use(`{
	"com1": {
		"component": "uppercase",
		"connections": {
			"0": [{ "id": "com2", "index": "0" }]
		}
	},
	"com2": {
		"component": "scheduler",
		"connections": {
			"0": [{ "id": "com3", "index": "0" }]
		}
	},
	"com3": {
		"component": "debug"
	}
}`, console.log);

flow.trigger('com1__0', 'Hello world!');
setTimeout(() => flow.destroy(), 2000);