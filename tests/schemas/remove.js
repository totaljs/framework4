NEWSCHEMA('Remove', function(schema) {
	
	schema.addWorkflow('exec', function($) {
		$.callback('exists');
	});

});