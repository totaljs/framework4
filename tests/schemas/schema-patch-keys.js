NEWSCHEMA('Schema/PatchKeys', function(schema) {

	schema.define('valid', 'String');
	schema.define('valid_required', 'String', true);

	schema.addWorkflow('exec', function($, model) {
		$.success({ keys: $.keys, model: model });
	});

});