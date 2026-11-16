// FlowStream running in the current process (no worker):
// Flow.restart() and Flow.reload(flow, true) restart the Flow instead of destroying it,
// the "flowstream_error" event fires for ON() and Flow.on() and the "stats" event fires.
//   cd tests && node flowstream-fixes.js

require('../index');

const Assert = require('assert');

var com = '<script total>\nexports.id = \'boom\';\nexports.name = \'Boom\';\nexports.outputs = [{ id: \'output\', name: \'Output\' }];\nexports.make = function(instance) {\n\tinstance.message = function($) {\n\t\tif ($.data && $.data.fail) {\n\t\t\tinstance.throw(new Error(\'kaboom\'));\n\t\t\treturn;\n\t\t}\n\t\t$.send(\'output\');\n\t};\n};\n</script>\n<body><header>Boom</header></body>';

function schema(id) {
	return { id: id, name: id, directory: PATH.join(__dirname, 'tmp'), components: { boom: com }, design: { b1: { id: 'b1', component: 'boom', config: {}, connections: {} } }, variables: {} };
}

var log = console.error;

function fail(e) {
	log(e);
	process.exit(1);
}

var errors_on = 0;
var errors_flow = 0;
var stats = [];

ON('flowstream_error', () => errors_on++);
Flow.on('flowstream_error', () => errors_flow++);
Flow.on('stats', (id, data) => stats.push({ id: id, data: data }));

// Hides the error output of the Flow
console.error = NOOP;

Flow.load(schema('fixes19'), function(err, instance) {
	try {
		Assert.ok(!err && instance, 'Flow.load()');

		instance.exec({ id: 'b1', data: { fail: 1 } });

		setTimeout(function() {
			try {
				Assert.strictEqual(errors_on, 1, 'ON(\'flowstream_error\') must fire');
				Assert.strictEqual(errors_flow, 1, 'Flow.on(\'flowstream_error\') must fire');

				// Flow.restart()
				var old = instance.flow;
				Assert.strictEqual(Flow.restart('fixes19'), true, 'Flow.restart() must return true');
				Assert.ok(old.$destroyed, 'the old Flow must be destroyed');
				var current = Flow.instances.fixes19;
				Assert.ok(current === instance, 'the instance must stay the same');
				Assert.ok(current.flow !== old, 'Flow.restart() must create a new Flow');
				Assert.ok(current.flow.$instance === instance, 'the new Flow must point to the instance');
			} catch (e) {
				fail(e);
			}

			setTimeout(function() {
				try {
					Assert.ok(instance.flow.meta && instance.flow.meta.flow.b1, 'the restarted Flow must contain its instances');

					// Flow.reload() with restart
					var prev = instance.flow;
					var data = schema('fixes19');
					data.name = 'renamed';
					Assert.strictEqual(Flow.reload(data, true), true, 'Flow.reload() must return true');
					Assert.ok(instance.flow !== prev, 'Flow.reload(flow, true) must create a new Flow');
					Assert.strictEqual(instance.flow.$schema.name, 'renamed', 'Flow.reload(flow, true) must use the new schema');
				} catch (e) {
					fail(e);
				}
			}, 300);

			setTimeout(function() {
				try {
					Assert.ok(instance.flow.meta && instance.flow.meta.flow.b1, 'the reloaded Flow must contain its instances');
					Assert.ok(F.flows.fixes19 === instance.flow, 'F.flows must contain the restarted Flow');

					var counter = 0;
					instance.exec({ id: 'b1', data: {}, callback: function(err) {
						counter++;
						try {
							Assert.ok(!err, 'the restarted Flow must process messages');
						} catch (e) {
							fail(e);
						}
					}});

					instance.exec({ id: 'b1', data: { fail: 1 } });

					setTimeout(function() {
						try {
							Assert.strictEqual(counter, 1, 'exec() callback in the restarted Flow');
							Assert.strictEqual(errors_on, 2, 'ON(\'flowstream_error\') must fire after restart');
						} catch (e) {
							fail(e);
						}
					}, 300);

				} catch (e) {
					fail(e);
				}
			}, 800);

			// Stats are emitted each 5 seconds
			setTimeout(function() {
				try {
					var item = stats.findItem('id', 'fixes19');
					Assert.ok(item, 'Flow.on(\'stats\') must fire for a Flow in the current process');
					Assert.ok(item.data && item.data.messages != null, 'the "stats" event must contain stats');
				} catch (e) {
					fail(e);
				}
				console.log('OK');
				process.exit(0);
			}, 6000);

		}, 300);

	} catch (e) {
		fail(e);
	}
});
