require('../index.js');

// RESTBuilder.POST('https://docanym.totalavengers.com/download/', { url: 'https://www.totaljs.com/download/ajqm001ft41d.svg', keywords: ['logo'] }).callback(console.log);

DOWNLOAD('https://www.uvo.gov.sk/vyhladavanie-dokumentov/document/3132897/content/1141691/download', 'aa.pdf', function(err) {
	console.log(err);
});
