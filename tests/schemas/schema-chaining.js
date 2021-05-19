NEWSCHEMA('Schema/Chaining', function(schema) {

	schema.define('value', 'Object', true);

	schema.addWorkflow('one', function($, model) {
		$.success(model.value.one);
	});

	schema.addWorkflow('two', function($, model) {
		$.success(model.value.two);
		PUBLISH('kokot', model);
	});

});

SUBSCRIBE('save', function(model) {

});