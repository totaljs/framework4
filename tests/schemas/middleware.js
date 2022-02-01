NEWSCHEMA('Middleware', function(schema) {

	schema.addWorkflow('exec', function($) {
		$.success();
	});

});