NEWSCHEMA('Schema/Notrequired', function(schema) {

	schema.define('number', 'Number');
	schema.define('email', 'Email');
	schema.define('phone', 'Phone');
	schema.define('boolean', 'Boolean');
	schema.define('uid', 'UID');
	schema.define('base64', 'Base64');
	schema.define('url', 'URL');
	schema.define('object', 'Object');
	schema.define('date', 'Date');
	schema.define('json', 'JSON');

	schema.addWorkflow('exec', function($, model) {
		$.callback(model);
	});

});