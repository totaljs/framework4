NEWOPERATION('OperationSuccess', function($) {

	$.success();

});

NEWOPERATION('OperationInvalid', function($) {

	$.invalid(404);

});

NEWOPERATION('OperationValue', function($, model) {

	var value = model.value;

	if (value !== $.model.value)
		value = -1;

	$.success(value);

});