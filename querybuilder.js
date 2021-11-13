const REG_FIELDS_CLEANER = /"|`|\||'|\s/g;
var CACHE = {};
var EVALUATOR = {};

function Database(conn) {
	var t = this;
	t.conn = conn;
	t.data = {};
	// t.data.db = '';
	// t.data.op = '';
	// t.data.payload = {};
	// t.data.fields = '';
	// t.data.sort = '';
	// t.data.take = 0;
	// t.data.skip = 0;
	t.data.filter = [];
}

function exec(db) {
	if (EVALUATOR[db.conn]) {
		EVALUATOR[db.conn](db, function(err, response) {
			db.evaluate(err, response);
		});
	} else
		db.evaluate('Database is not initialized');
}

function QueryBuilder(main, db, op) {
	var t = this;
	t.main = main;
	t.filter = main.data.filter;
	main.data.db = db;
	main.data.op = op;
	setImmediate(exec, main);
}

var DBP = Database.prototype;
var QBP = QueryBuilder.prototype;

DBP.evaluate = function(err, response) {
	var t = this;

	if (!err && !response && t.error)
		err = t.error;

	if (t.data.first && response instanceof Array)
		response = response[0];

	t.callback && t.callback(err, response);
};

DBP.find = function(db) {
	var t = this;
	return new QueryBuilder(t, db, 'find');
};

DBP.list = function(db) {
	var t = this;
	return new QueryBuilder(t, db, 'list');
};

DBP.read = DBP.one = function(db) {
	var t = this;
	return new QueryBuilder(t, db, 'read');
};

DBP.count = function(db) {
	var t = this;
	return new QueryBuilder(t, db, 'count');
};

DBP.scalar = function(db, type, key, key2) {

	var t = this;

	if (key == null) {
		key = type;
		type = '*';
	}

	t.data.scalar = {};
	t.data.scalar.type = type;

	if (key)
		t.data.scalar.key = key;

	if (key2)
		t.data.scalar.key2 = key2;

	return new QueryBuilder(t, db, 'scalar');
};

DBP.insert = function(db, data) {
	var t = this;
	t.data.payload = data;
	return new QueryBuilder(t, db, 'insert');
};

DBP.update = DBP.modify = DBP.mod = function(db, data, upsert) {
	var t = this;
	t.data.payload = data;
	t.data.upsert = upsert;
	return new QueryBuilder(t, db, 'update');
};

DBP.remove = DBP.rem = function(db) {
	var t = this;
	return new QueryBuilder(t, db, 'remove');
};

DBP.drop = function(db) {
	return new QueryBuilder(this, db, 'drop');
};

DBP.truncate = DBP.clear = function(db) {
	return new QueryBuilder(this, db, 'truncate');
};

DBP.command = function(name, db) {
	var t = this;
	t.data.command = name;
	return new QueryBuilder(t, db, 'command');
};

QBP.promise = function() {
	var t = this;
	var promise = new Promise(function(reject, resolve) {
		t.main.callback = function(err, response) {
			if (err)
				reject(err);
			else
				resolve(response);
		};
	});
	return promise;
};

QBP.callback = function(cb) {
	var t = this;
	t.main.callback = cb;
	return t;
};

QBP.error = QBP.err = function(err) {
	this.main.error = err + '';
	return this;
};

QBP.done = function($, callback, param) {
	this.main.callback = function(err, response) {
		if (err)
			$.invalid(err);
		else
			callback(response, param);
	};
	return this;
};

QBP.id = function(id) {
	return id instanceof Array ? this.in('id', id) : this.where('id', id);
};

QBP.userid = function(id) {
	return id instanceof Array ? this.in('userid', id) : this.where('userid', id);
};

QBP.where = function(name, comparer, value) {

	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	switch (comparer) {
		case '==':
			comparer = '=';
			break;
		case '!=':
			comparer = '<>';
			break;
	}

	t.filter.push({ type: 'where', name: name, comparer: comparer, value: value });
	return t;
};

QBP.take = function(count) {
	this.main.data.take = count;
	return this;
};

QBP.first = function() {
	this.main.data.take = this.main.data.first = 1;
	return this;
};

QBP.limit = function(count) {
	this.main.data.take = count;
	return this;
};

QBP.page = function(page, limit) {
	if (limit)
		this.main.data.take = limit;
	this.main.data.skip = (page - 1) * this.main.data.take;
	return this;
};

QBP.paginate = function(page, limit, maxlimit) {

	var limit2 = +(limit || 0);
	var page2 = (+(page || 0)) - 1;

	if (page2 < 0)
		page2 = 0;

	if (maxlimit && limit2 > maxlimit)
		limit2 = maxlimit;

	if (!limit2)
		limit2 = maxlimit;

	this.main.data.skip = page2 * limit2;
	this.main.data.take = limit2;
	return this;
};

QBP.skip = function(count) {
	this.main.data.skip = count;
	return this;
};

QBP.in = function(name, value, id) {
	var t = this;

	if (id) {
		var arr = [];
		for (var i = 0; i < value.length; i++)
			arr.push(value[i][id]);
		value = arr;
	}

	if (!(value instanceof Array))
		value = [value];

	t.filter.push({ type: 'in', name: name, value: value });
	return t;
};

QBP.notin = function(name, value, id) {
	var t = this;

	if (id) {
		var arr = [];
		for (var i = 0; i < value.length; i++)
			arr.push(value[i][id]);
		value = arr;
	}

	if (!(value instanceof Array))
		value = [value];

	t.filter.push({ type: 'notin', name: name, value: value });
	return t;
};

QBP.between = function(name, a, b) {
	var t = this;
	t.filter.push({ type: 'between', name: name, a: a, b: b });
	return t;
};

QBP.or = function(callback) {
	var t = this;
	var filter = t.filter;
	t.filter = [];
	callback.call(t, t);
	if (t.filter.length)
		filter.push({ type: 'or', value: t.filter });
	t.filter = filter;
	return t;
};

QBP.fields = function(fields) {
	var t = this;
	var arr = [];

	fields = fields.split(',');

	for (var field of fields) {
		field = field.trim();
		arr.push(field);
	}

	t.main.data.fields = arr;
	return t;
};

QBP.month = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.filter.push({ type: 'month', name: name, comparer: comparer, value: value });
	return t;
};

QBP.day = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.filter.push({ type: 'day', name: name, comparer: comparer, value: value });
	return t;
};

QBP.year = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.filter.push({ type: 'year', name: name, comparer: comparer, value: value });
	return t;
};

QBP.hour = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.filter.push({ type: 'hour', name: name, comparer: comparer, value: value });
	return t;
};

QBP.minute = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.filter.push({ type: 'minute', name: name, comparer: comparer, value: value });
	return t;
};

QBP.search = function(name, value, where) {
	var t = this;
	t.filter.push({ type: 'search', name: name, comparer: where, value: value });
	return t;
};

QBP.contains = function(name) {
	var t = this;
	t.filter.push({ type: 'contains', name: name });
	return t;
};

QBP.empty = function(name) {
	var t = this;
	t.filter.push({ type: 'empty', name: name });
	return t;
};

// Converting values
var convert = function(value, type) {

	if (type === undefined || type === String)
		return value;

	if (type === Number)
		return value.trim().parseFloat();

	if (type === Date) {
		value = value.trim();
		if (value.indexOf(' ') !== -1)
			return NOW.add('-' + value);
		if (value.length < 8) {
			var tmp;
			var index = value.indexOf('-');
			if (index !== -1) {
				tmp = value.split('-');
				value = NOW.getFullYear() + '-' + (tmp[0].length > 1 ? '' : '0') + tmp[0] + '-' + (tmp[1].length > 1 ? '' : '0') + tmp[1];
			} else {
				index = value.indexOf('.');
				if (index !== -1) {
					tmp = value.split('.');
					value = NOW.getFullYear() + '-' + (tmp[1].length > 1 ? '' : '0') + tmp[0] + '-' + (tmp[0].length > 1 ? '' : '0') + tmp[1];
				} else {
					index = value.indexOf(':');
					if (index !== -1) {
						// hours
					} else if (value.length <= 4) {
						value = +value;
						return value || 0;
					}
				}
			}
		}

		return value.trim().parseDate();
	}

	if (type === Boolean)
		return value.trim().parseBoolean();

	return value;
};

QBP.gridfields = function(fields, allowed) {

	var t = this;
	var count = 0;
	var newfields = [];

	fields = fields.replace(REG_FIELDS_CLEANER, '').split(',');

	if (allowed)
		allowed = allowed.split(',');

	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		var can = !allowed;
		if (!can) {
			for (var j = 0; j < allowed.length; j++) {
				if (allowed[j] === field) {
					can = true;
					break;
				}
			}
		}
		if (can) {
			newfields.push(fields[i]);
			count++;
		}
	}

	if (!count)
		t.main.data.fields = newfields.join(',');

	return t;
};

// Grid filtering
QBP.gridfilter = function(name, obj, type, key) {

	var builder = this;
	var value = obj[name] || '';

	if (!value)
		return builder;

	var arr, val;

	if (!key)
		key = name;

	// Between
	var index = value.indexOf(' - ');
	if (index !== -1) {

		arr = value.split(' - ');

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i].trim();
			arr[i] = convert(item, type);
		}

		if (type === Date) {
			if (typeof(arr[0]) === 'number') {
				arr[0] = new Date(arr[0], 1, 1, 0, 0, 0);
				arr[1] = new Date(arr[1], 11, 31, 23, 59, 59);
			} else
				arr[1] = arr[1].extend('23:59:59');
		}

		return builder.between(key, arr[0], arr[1]);
	}

	// Multiple values
	index = value.indexOf(',');
	if (index !== -1) {

		var arr = value.split(',');

		if (type === undefined || type === String) {
			builder.or(function() {
				for (var i = 0; i < arr.length; i++) {
					var item = arr[i].trim();
					builder.search(key, item);
				}
			});
			return builder;
		}

		for (var i = 0; i < arr.length; i++)
			arr[i] = convert(arr[i], type);

		return builder.in(key, arr);
	}

	if (type === undefined || type === String)
		return builder.search(key, value);

	if (type === Date) {

		if (value === 'yesterday')
			val = NOW.add('-1 day');
		else if (value === 'today')
			val = NOW;
		else
			val = convert(value, type);

		if (typeof(val) === 'number') {
			if (val > 1000)
				return builder.year(key, val);
			else
				return builder.month(key, val);
		}

		if (!(val instanceof Date) || !val.getTime())
			val = NOW;

		return builder.between(key, val.extend('00:00:00'), val.extend('23:59:59'));
	}

	return builder.where(key, convert(value, type));
};

QBP.sort = function(sort, type) {
	var t = this;
	if (!t.main.data.sort)
		t.main.data.sort = [];
	t.main.data.sort.push(sort + '_' + (type === true || type === 'desc' ? 'desc' : 'asc'));
	return t;
};

QBP.gridsort = function(sort) {

	var t = this;

	if (!t.main.data.sort)
		t.main.data.sort = [];

	var keys = sort.split(',');
	for (var key of keys) {
		key = key.trim();
		var index = key.lastIndexOf('_');
		t.main.data.sort.push(index === -1 ? (key + '_asc') : key);
	}

	return t;
};

QBP.autofill = function($, allowedfields, skipfilter, defsort, maxlimit) {

	if (typeof(defsort) === 'number') {
		maxlimit = defsort;
		defsort = null;
	}

	var t = this;
	var query = $.query || $.options;
	var schema = $.schema;
	var skipped;
	var allowed;
	var key;
	var tmp;

	if (skipfilter) {
		key = 'NDB_' + skipfilter;
		skipped = CACHE[key];
		if (!skipped) {
			tmp = skipfilter.split(',').trim();
			var obj = {};
			for (var i = 0; i < tmp.length; i++)
				obj[tmp[i]] = 1;
			skipped = CACHE[key] = obj;
		}
	}

	if (allowedfields) {
		key = 'NDB_' + allowedfields;
		allowed = CACHE[key];
		if (!allowed) {
			var obj = {};
			var arr = [];
			var filter = [];
			tmp = allowedfields.split(',').trim();
			for (var i = 0; i < tmp.length; i++) {
				var k = tmp[i].split(':').trim();
				obj[k[0]] = 1;
				arr.push(k[0]);
				k[1] && filter.push({ name: k[0], type: (k[1] || '').toLowerCase() });
			}
			allowed = CACHE[key] = { keys: arr, meta: obj, filter: filter };
		}
	}

	var fields = query.fields;
	var fieldscount = 0;
	var newfields = [];

	if (fields) {
		fields = fields.replace(REG_FIELDS_CLEANER, '').split(',');
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			if (allowed && allowed.meta[field]) {
				newfields.push(field);
				fieldscount++;
			} else if (schema.schema[field]) {
				if (skipped && skipped[field])
					continue;
				newfields.push(field);
				fieldscount++;
			}
		}
	}

	if (!fieldscount) {
		if (allowed) {
			for (var item of allowed.keys)
				newfields.push(item);
		}
		if (schema.fields) {
			for (var item of schema.fields) {
				if (skipped && skipped[item])
					continue;
				newfields.push(item);
			}
		}
	}

	if (allowed && allowed.filter) {
		for (var item of allowed.filter)
			t.gridfilter(item.name, query, item.type);
	}

	if (schema.fields) {
		for (var name of schema.fields) {
			if ((!skipped || !skipped[name]) && query[name]) {
				var field = schema.schema[name];
				var type = 'string';
				switch (field.type) {
					case 2:
						type = 'number';
						break;
					case 4:
						type = 'boolean';
						break;
					case 5:
						type = 'date';
						break;
				}
				t.gridfilter(name, query, type);
			}
		}
	}

	if (query.sort) {

		var sort = query.sort.split(',');
		var sortvalue = '';

		for (var item of sort) {

			var index = item.lastIndexOf('_');
			var name = index > 1 ? item.substring(0, index) : item;

			if (skipped && skipped[name])
				continue;

			if (allowed) {
				if (!allowed.meta[name] && !schema.schema[name])
					continue;
			} else if (!schema.schema[name])
				continue;

			sortvalue += (sortvalue ? ',' : '') + item;
		}

		if (!sortvalue && defsort)
			sortvalue = defsort;

		if (sortvalue)
			t.gridsort(sortvalue);

	} else if (defsort)
		t.gridsort(defsort);

	t.paginate(query.page, query.limit, maxlimit || 50);
	return t;
};

QBP.autoquery = function(query, schema, defsort, maxlimit) {

	var t = this;
	var skipped;
	var key = 'QBF' + schema;
	var allowed = CACHE[key];
	var tmp;

	if (!allowed) {
		var obj = {};
		var arr = [];
		var filter = [];
		tmp = schema.split(',').trim();

		for (var i = 0; i < tmp.length; i++) {
			var k = tmp[i].split(':').trim();
			obj[k[0]] = 1;
			arr.push(k[0]);
			k[1] && filter.push({ name: k[0], type: (k[1] || 'string').toLowerCase() });
		}

		allowed = CACHE[key] = { keys: arr, meta: obj, filter: filter };
	}

	var fields = query.fields;
	var fieldscount = 0;

	if (!t.main.data.fields)
		t.main.data.fields = [];

	if (fields) {
		fields = fields.replace(REG_FIELDS_CLEANER, '').split(',');
		for (var field of fields) {
			if (allowed && allowed.meta[field]) {
				t.main.data.fields.push(field);
				fieldscount++;
			}
		}
	}

	if (!fieldscount) {
		for (var field of allowed.keys)
			t.main.data.fields.push(field);
	}

	if (allowed && allowed.filter) {
		for (var item of allowed.filter)
			t.gridfilter(item.name, query, item.type);
	}

	if (query.sort) {

		tmp = query.sort.split(',');
		var count = 0;

		for (var item of tmp) {
			var index = item.lastIndexOf('_');
			var name = index === - 1 ? item : item.substring(0, index);

			if ((skipped && skipped[name]) || (!allowed.meta[name]))
				continue;

			t.sort(name, item[index + 1] === 'd');
			count++;
		}

		if (!count && defsort)
			t.gridsort(defsort);

	} else if (defsort)
		t.gridsort(defsort);

	maxlimit && t.paginate(query.page, query.limit, maxlimit);

	return t;
};

QBP.join = function(name, db, jointype, a, b) {
	var t = this;
	t.filter.push({ type: 'join', db: db, name: name, join: jointype, on: [a, b] });
	return t;
};

ON('service', function(counter) {
	if (counter % 10 === 0)
		CACHE = {};
});

exports.evaluate = function(type, callback) {

	if (typeof(type) === 'function') {
		callback = type;
		type = 'default';
	}

	EVALUATOR[type] = callback;
};

exports.make = function(conn) {
	return new Database(conn || 'default');
};