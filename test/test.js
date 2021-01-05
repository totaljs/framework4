require('../index');

// CONF.totalapi = '20201209xgao11d12kq1b6ckmr2f3lyzx';

// TotalAPI('20201209xgao11d12kq1b6ckmr2f3lyzx', 'geoip', '92.245.31.220', console.log);
// TotalAPI('checkvat', 'SK2120417167', console.log);

var opt = {};
opt.headers = { 'User-Agent': 'Paysera node.js library', mac_id: 'GMmbfliroYVFztGw' }
opt.url = 'https://www.totaljs.com';
console.log(opt);


opt.callback = function(err, response) {
	console.log(err, response);
};

REQUEST(opt);