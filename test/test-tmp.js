require('../index');

NEWSCHEMA('Users', function(schema) {
	schema.setQuery(function($) {
		$.success();
	});
});

ROUTE('GET  /api/users/ *Users --> @query');
ROUTE('POST /api/users/ *Users --> @save');

TEST(function(test, response) {
	test('GET /api/users/', 'Users list');
	test('POST /api/users/', 'Users save');
}, (err, output) => console.log(output));