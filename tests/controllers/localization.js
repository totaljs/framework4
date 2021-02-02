exports.install = function() {

	ROUTE('GET /localization', function() {
		this.view('/index');
	});

	ROUTE('GET /localization/sk/', function() {
		this.language = 'sk';
		this.view('/index');
	});

	ROUTE('GET /localization/en/', function() {
		this.view('/index');
	});

};