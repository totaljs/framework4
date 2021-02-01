NEWSCHEMA('Headers', function(schema) {

	schema.addWorkflow('xtoken', function($) {
		$.callback($.headers['x-token']);
	});
	
});