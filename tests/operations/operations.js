var assert = require('assert');

NEWOPERATION('OperationSuccess', function($) {

	$.success();

});

NEWOPERATION('OperationInvalid', function($) {

	$.invalid(404);

}, false);

NEWOPERATION('OperationValue', function($, model) {

	if (model.value === 'invalid')
		assert(true, 'OPERATIONS - Schema operation (run invalid)');

	$.success(model.value);

});

NEWOPERATION('OperationStop', function($) {

	$.invalid(404);

});