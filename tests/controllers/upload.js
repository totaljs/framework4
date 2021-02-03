exports.install = function() {

	ROUTE('POST /upload/', upload, ['upload'], 1024);

};

function upload() {

	var self = this;
	var files = self.files;
	var response = [];

	files.wait(function(file, next) {
		file.read(function(err, data) {
			if (err) throw err;
			response.push(data.toString());
			next();
		});
	}, function() {
		console.log('sending -->', response);
		self.success(response);
	});

}