const Fs = require('fs');

function Counter(name) {
	var t = this;
	t.db = 'counter_' + name;
	t.cache = {};
}

const CP = Counter.prototype;

CP.hit = function(id, value) {
	var self = this;
	var key = '+' + id;
	if (self.cache[key]) {

		self.cache[key].sum += value;

		if (self.cache[key].min == null || self.cache[key].min > value)
			self.cache[key].min = value;

		if (self.cache[key].max == null || self.cache[key].max < value)
			self.cache[key].max = value;
	} else
		self.cache[key] = { sum: value, min: value, max: value };

	return self;
};

CP.flush = function() {

	var self = this;
	var keys = Object.keys(self.cache);

	var db = NOSQL(self.db);

	for (var i = 0; i < keys.length; i++) {

		var key = keys[i];
		var val = self.cache[key];
		var m = {};

		m.id = key.substring(1);

		m['+sum'] = val.sum;
		m['>min'] = val.min;
		m['<max'] = val.max;

		m.day = NOW.getDate();
		m.month = NOW.getMonth() + 1;
		m.year = NOW.getFullYear();
		m.date = NOW;
		db.update(m, true).where('id', m.id);
	}

	self.cache = {};
	return self;
};

exports.make = function(name) {
	return new Counter(name);
};