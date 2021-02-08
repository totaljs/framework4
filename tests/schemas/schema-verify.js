NEWSCHEMA('Schema/Verify', function(schema) {

	schema.define('countryid', 'Lowercase(2)', true);

	schema.verify('countryid', function($) {
		var countries = ['en', 'sk', 'cz', 'ru'];

		// Asynchronous simulation
		setTimeout(function() {
			var result = countries.find(i => i === $.value);

			if (result)
				$.next(result);
			else
				$.invalid(400);

		}, 100);

	}, '20 seconds');

	schema.addWorkflow('exec', function($, model) {
		$.success(model);
	});

});