NEWSCHEMA('Operations', function(schema) {

	schema.define('value', 'Object');

	schema.addWorkflow('success', function($) {
		OPERATION('OperationSuccess', $.callback);
	});

	schema.addWorkflow('invalid', function($) {
		OPERATION('OperationInvalid', $.callback);
	});

	schema.addWorkflow('value', function($, model) {
		OPERATION('OperationValue', model, $.callback);
	});

	schema.addWorkflow('run_invalid', function($, model) {
		RUN('OperationSuccess, OperationInvalid, OperationValue', model, $.callback, 'OperationValue');
	});

	schema.addWorkflow('run_success', function($, model) {
		RUN('OperationSuccess, OperationValue', model, $.callback, 'OperationValue');
	});

	schema.addWorkflow('run_stop', function($, model) {
		RUN('OperationSuccess, OperationStop, OperationValue', model, $.callback, 'OperationValue');
	});

});