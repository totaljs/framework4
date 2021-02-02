NEWSCHEMA('Schema/Extensions', function(schema) {

	// Methods
	schema.setQuery(function($) {
		$.extend('query_extended');
	});

	schema.setRead(function($) {
		$.extend('read_extended');
	});

	schema.setInsert(function($) {
		$.extend('insert_extended');
	});

	schema.setUpdate(function($) {
		$.extend('update_extended');
	});

	schema.setPatch(function($) {
		$.extend('patch_extended');
	});

	schema.setRemove(function($) {
		$.extend('remove_extended');
	});

	schema.addWorkflow('workflow', function($) {
		$.extend('workflow_extended');
	});

	// Extensions
	schema.setQueryExtension(function($, model) {
		$.success(model);
	});

	schema.setReadExtension(function($, model) {
		$.success(model);
	});

	schema.setInsertExtension(function($, model) {
		$.success(model);
	});

	schema.setUpdateExtension(function($, model) {
		$.success(model);
	});

	schema.setPatchExtension(function($, model) {
		$.success(model);
	});

	schema.setRemoveExtension(function($, model) {
		$.success(model);
	});

	schema.addWorkflowExtension('workflow', function($, model) {
		$.success(model);
	});

});