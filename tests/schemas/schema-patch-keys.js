NEWSCHEMA('Schema/PatchKeys', function(schema) {

	schema.define('valid', 'String(5)');
	schema.define('valid_required', 'String(5)', true);

	schema.addWorkflow('exec', function($, model) {
		console.log(model);
		console.log('keys', $.keys, $.req.method);
		$.success($.keys);
	});

});