NEWSCHEMA('Schema/MethodsValidation', function(schema) {

	schema.define('value', 'String', true);

	schema.addWorkflow('exec', function($) {
		$.success();
	});

});