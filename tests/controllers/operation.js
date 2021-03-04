exports.install = function() {

	ROUTE('GET     /operations/success/                *             --> OperationSuccess');
	ROUTE('GET     /operations/invalid/                *             --> OperationInvalid');
	ROUTE('POST    /operations/value/                  *             --> OperationValue');

	ROUTE('POST    /operations/multiple/one/           *             --> OperationSuccess (response) OperationValue');
	ROUTE('POST    /operations/multiple/two/           *             --> OperationSuccess OperationValue (response)');

	ROUTE('GET     /operations/schema/success/        *Operations    --> success');
	ROUTE('GET     /operations/schema/invalid/        *Operations    --> invalid');
	ROUTE('POST    /operations/schema/value/          *Operations    --> value');

	ROUTE('POST    /operations/schema/run/invalid/    *Operations    --> run_invalid');
	ROUTE('POST    /operations/schema/run/success/    *Operations    --> run_success');
	ROUTE('POST    /operations/schema/run/stop/       *Operations    --> run_stop');

};