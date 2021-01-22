require('../index');
const Fs = require('fs');

CONF.totalapi = '20201209xgao11d12kq1b6ckmr2f3lyzx';

// TotalAPI('20201209xgao11d12kq1b6ckmr2f3lyzx', 'geoip', '92.245.31.220', console.log);
// TotalAPI('checkvat', 'SK2120417167', console.log);

TotalAPI('print', { type: 'pdf', html: 'https://www.totaljs.com' }, function(err, response) {
	console.log(err);
	if (!err) {
		response.on('chunk', chunk => console.log(chunk));
		response.pipe(Fs.createWriteStream('test.pdf'));
	}
});