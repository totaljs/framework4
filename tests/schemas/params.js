NEWSCHEMA('Params', function(schema) {

	schema.addWorkflow('alias', function($) {
		$.callback($.id);
	});

	schema.addWorkflow('params', function($) {
		$.callback($.params.id);
	});

	schema.addWorkflow('params2', function($) {
		$.callback($.params.id2);
	});

	schema.addWorkflow('params3', function($) {
		$.callback($.params.id3);
	});

});