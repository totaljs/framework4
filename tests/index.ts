ROUTE('GET /users/{id}/', function(id) {
	this.json(id);
});

ROUTE('FILE /download/*.*', function(req, res) {
	res.json(req);

	var fs = require('fs');

	[123].findAll(() => {});

	
});