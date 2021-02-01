NEWSCHEMA('Schema/Formatting', function(schema) {

	schema.define('number', 'Number');
	schema.define('number_float', 'Number');
	schema.define('string', 'String');
	schema.define('string_name', 'Name');
	schema.define('string_capitalize', 'Capitalize');
	schema.define('string_capitalize2', 'Capitalize2');
	schema.define('string_lowercase', 'Lowercase');
	schema.define('string_uppercase', 'Uppercase');

	schema.addWorkflow('exec', function($, model) {
		$.callback(model);
	});

});