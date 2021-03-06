NEWSCHEMA('Wildcards', function(schema) {

	schema.addWorkflow('one', function($) {
		$.success(1);
	});

	schema.addWorkflow('two', function($) {
		$.success(2);
	});

	schema.addWorkflow('three', function($) {
		$.success(3);
	});

	schema.addWorkflow('four', function($) {
		$.success(4);
	});

});