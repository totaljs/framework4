NEWSCHEMA('Schema/MethodsValidation', function(schema) {

	schema.define('email', 'Email', true);

	schema.addWorkflow('exec', function($) {
		$.success();
	});

});