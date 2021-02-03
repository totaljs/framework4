exports.install = function() {

	ROUTE('POST /upload/', upload, ['upload'], 1024);

};

function upload() {

	var self = this;
	var files = self.files;
	var response = {};
	response.files = [];

	files.wait(function(file, next) {
		file.read(function(err, data) {
			if (err) throw err;
			response.files.push(data.toString());
			next();
		});
	}, function() {
		response.value = self.body.value;
		self.success(response);
	});

}