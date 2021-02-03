exports.install = function() {

	ROUTE('/upload/', upload, ['upload'], 1024);

};

function upload() {
	console.log('upload -->', this.files);
}