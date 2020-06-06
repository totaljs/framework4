// Copyright 2012-2020 (c) Peter Širka <petersirka@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * @module Counter
 * @version 4.0.0
 */

function Counter(name) {
	var t = this;
	t.db = require('./textdb-wrapper').make('nosql', name, F.textdbworker, '.counter');
	t.cache = {};
	ON('service', function(counter) {
		if (counter % 5 === 0)
			t.flush();
	});
}

const CP = Counter.prototype;

CP.hit = function(id, value) {

	if (value == null)
		value = 1;

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
		self.db.update(m, true).where('id', m.id);
	}

	self.cache = {};
	return self;
};

exports.make = function(name) {
	return new Counter(name);
};