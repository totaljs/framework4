NEWSCHEMA('Schema/Required', function(schema) {

	schema.define('number', 'Number', true);
	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone', true);
	schema.define('boolean', 'Boolean', true);
	schema.define('uid', 'UID', true);
	schema.define('base64', 'Base64', true);
	schema.define('url', 'URL', true);
	schema.define('object', 'Object', true);
	schema.define('date', 'Date', true);
	schema.define('json', 'JSON', true);

	schema.addWorkflow('exec', function($, model) {
		$.callback(model);
	});

});