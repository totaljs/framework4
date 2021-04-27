NEWSCHEMA('APIRoutes', function(schema) {

	schema.define('valid', 'String');

	schema.addWorkflow('success', function($, model) {
		$.success(model);
	});

	schema.addWorkflow('keys', function($) {
		$.success($.keys);
	});

	schema.addWorkflow('one', function($) {
		$.success();
	});

	schema.addWorkflow('two', function($) {
		$.success();
	});

});