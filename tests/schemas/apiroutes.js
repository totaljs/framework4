NEWSCHEMA('APIRoutes', function(schema) {

	schema.define('valid', 'String');

	schema.addWorkflow('success', function($, model) {
		$.success(model);
	});

	schema.addWorkflow('keys', function($) {
		$.success($.keys);
	});

});