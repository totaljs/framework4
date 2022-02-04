// Tester module v1

exports.make = function(callback) {

	var tester = {};
	tester.dtbeg = new Date();
	tester.dtend = null;
	tester.groups = [];
	tester.group = function(name, test) {
		tester.groups.push({ name: name, callback: test, fallback: null, tests: [] });
	};

	tester.start = function(callback) {

		tester.groups.wait(function(group, next_group) {

			// Add test to queue
			group.callback(function(test_name, test_callback) {

				// Optional test name
				if (typeof(test_name) === 'function') {
					test_callback = test_name;
					test_name = null;
				}

				group.tests.push({ name: test_name, callback: test_callback });

			}, function(fallback) {
				group.fallback = fallback;
			});

			// Start tests
			group.tests.wait(function(test, next_test) {
				// Evaluate test
				test.callback(function(err) {

					if (err) {
						var obj = { group: group.name, test: test.name, err: err };
						group.fallback(obj);
						throw new Error(group.name + ' - ' + test.name + (err instanceof Error || typeof(err) === 'string' ? (' (' + err + ')') : ''));
					}

					if (test.name)
						console.log('[OK]', group.name, '-',  test.name);

					next_test();
				});
			}, function() {
				// Run fallback and go to next group
				group.fallback && group.fallback();
				next_group();
			});

		}, function() {
			tester.dtend = new Date();
			tester.duration = tester.dtend.getTime() - tester.dtbeg.getTime();
			console.log('[DONE] in', tester.duration, 'ms');
			callback && callback();
		});
	};

	callback && callback(tester.group, tester.start);
	return tester;
};