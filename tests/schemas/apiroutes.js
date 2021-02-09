NEWSCHEMA('APIRoutes', function(schema) {

	schema.define('value', 'String');

	schema.addWorkflow('success', function($, model) {
		console.log('abc', model);
		$.success(model);
	});

});