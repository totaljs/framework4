NEWSCHEMA('Schema/Middleware', function(schema) {

	schema.middleware(function($, next) {

		if ($.name === 'workflow.one') {
			next();
		} else {
			$.invalid(400);
			next(true);
		}

	});

	schema.addWorkflow('one', function($) {
		$.success();
	});

	schema.addWorkflow('two', function($) {
		$.success();
	});

});