require('../index');

ROUTE('API /apiv1/  -kokotaris    *Schema --> @test');
ROUTE('API /apiv1/  +dynamic/id   *Schema --> @test');

NEWSCHEMA('Schema', function(schema) {

	schema.define('agencyid', UID);
	schema.define('users', '[UID]');
	schema.define('schema', 'String(50)');
	schema.define('body', 'String(300)');


	schema.setInsert(function($, model) {
		console.log('--->', model);
	});


	schema.setPatch(function($, model) {
		console.log('--->', model);
	});
});

$INSERT('Schema', { schema: 'kokot' }, console.log);