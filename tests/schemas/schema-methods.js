NEWSCHEMA('Schema/Methods', function(schema) {

	schema.define('value', 'String');

	schema.setQuery(function($, model) {
		$.success(model);
	});

	schema.setRead(function($, model) {
		$.success(model);
	});

	schema.setInsert(function($, model) {
		$.success(model);
	});

	schema.setUpdate(function($, model) {
		$.success(model);
	});

	schema.setPatch(function($, model) {
		$.success(model);
	});

	schema.setRemove(function($, model) {
		$.success(model);
	});

	schema.addWorkflow('workflow', function($, model) {
		$.success(model);
	});

});