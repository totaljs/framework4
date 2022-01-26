const REG_FIELDS_CLEANER = /"|`|\||'|\s/g;
const REG_PG_ESCAPE_1 = /'/g;
const REG_PG_ESCAPE_2 = /\\/g;

var CACHE = {};
var EVALUATOR = {};

function QueryBuilderOptions() {}

function Database(conn) {
	var t = this;
	t.conn = conn;
	t.options = new QueryBuilderOptions();
	// t.options.db = String;                -- database/collection/table
	// t.options.exec = String;              -- operation name (find/insert/remove/etc..)
	// t.options.payload = {};
	// t.options.upsert = Boolean;
	// t.options.fields = String Array;
	// t.options.sort = String Array;        -- in the form: field_asc, field_desc
	// t.options.take = Number;
	// t.options.skip = Number;
	// t.options.filter = Object Array       -- types: where/in/notin/or/between/contains/empty
	t.options.filter = [];
}

function execdb(db) {
	if (EVALUATOR[db.conn]) {
		if (db.options.checksum)
			db.options.checksum = HASH(db.options.checksum).toString(36);
		EVALUATOR[db.conn].call(db, db.options, function(err, response) {
			db.evaluate(err, response);
		});
	} else
		db.evaluate('Database is not initialized');
}

function QueryBuilder(main, table, exec, multiple) {

	var t = this;

	t.main = main;
	t.options = main.options;
	t.options.checksum = '';
	t.options.table = table;
	t.options.exec = exec;
	t.filter = t.options.filter;

	if (exec === 'list') {
		t.options.skip = 0;
		t.options.take = 100;
	}

	if (exec === 'read') {
		t.options.take = 1;
		t.options.first = true;
	}

	if (!multiple)
		setImmediate(execdb, main);
}

var DBP = Database.prototype;
var QBP = QueryBuilder.prototype;

DBP.evaluate = function(err, response) {

	var t = this;

	if (t.options.first && response instanceof Array)
		response = response[0];

	if (t.options.exec === 'list') {
		response.page = (t.options.skip / t.options.take) + 1;
		response.limit = t.options.take;
		response.pages = Math.ceil(response.count / t.options.take);
	}

	if (!err && t.error) {
		if (!response)
			err = t.error;
		else if (!t.options.first && response instanceof Array && !response.length)
			err = t.error;
	}

	if (err) {
		t.callback_fail && t.callback_fail(err);
	} else {
		t.callback_data && t.callback_data(response);
	}

	t.callback && t.callback(err, response);
};

DBP.find = DBP.all = function(table) {
	var t = this;
	return new QueryBuilder(t, table, 'find');
};

DBP.list = function(table) {
	var t = this;
	return new QueryBuilder(t, table, 'list');
};

DBP.read = DBP.one = function(table) {
	var t = this;
	return new QueryBuilder(t, table, 'read');
};

DBP.count = function(table) {
	var t = this;
	return new QueryBuilder(t, table, 'count');
};

DBP.scalar = function(table, type, key, key2) {

	var t = this;

	if (key == null)
		key = '*';

	t.options.scalar = {};
	t.options.scalar.type = type;

	if (key)
		t.options.scalar.key = key;

	if (key2)
		t.options.scalar.key2 = key2;

	return new QueryBuilder(t, table, 'scalar');
};

DBP.insert = DBP.ins = function(table, data) {
	var t = this;
	t.options.payload = data;
	return new QueryBuilder(t, table, 'insert');
};

DBP.update = DBP.modify = DBP.mod = DBP.upd = function(table, data, upsert) {
	var t = this;
	t.options.payload = data;
	t.options.upsert = upsert;
	return new QueryBuilder(t, table, 'update');
};

DBP.remove = DBP.rem = function(table) {
	var t = this;
	return new QueryBuilder(t, table, 'remove');
};

DBP.query = function(query) {
	var t = this;
	return new QueryBuilder(t, query, 'query');
};

DBP.drop = function(table) {
	return new QueryBuilder(this, table, 'drop');
};

DBP.truncate = DBP.clear = function(table) {
	return new QueryBuilder(this, table, 'truncate');
};

DBP.command = function(name, table) {
	var t = this;
	t.options.command = name;
	return new QueryBuilder(t, table, 'command');
};

DBP.custom = function(type, table, data) {
	var t = this;
	t.options.payload = data;
	return new QueryBuilder(t, table, type);
};

QBP.promise = function($) {
	var t = this;
	var promise = new Promise(function(resolve, reject) {
		t.main.callback = function(err, response) {
			if (err) {
				if ($ && $.invalid)
					$.invalid(err);
				else
					reject(err);
			} else
				resolve(response);
		};
	});
	return promise;
};

QBP.callback = function(cb) {
	var t = this;
	if (cb == null || typeof(cb) !== 'function')
		return t.promise(cb);
	t.main.callback = cb;
	return t;
};

QBP.data = function(cb) {
	var t = this;
	t.main.callback_data = cb;
	return t;
};

QBP.fail = function(cb) {
	var t = this;
	t.main.callback_fail = cb;
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

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'where' + comparer + name;
	t.filter.push({ type: 'where', name: name, comparer: comparer, value: value });
	return t;
};

QBP.take = function(count) {
	this.options.take = count;
	return this;
};

QBP.first = function() {
	this.options.take = this.options.first = 1;
	return this;
};

QBP.limit = function(count) {
	this.options.take = count;
	return this;
};

QBP.page = function(page, limit) {
	if (limit)
		this.options.take = limit;
	this.options.skip = (page - 1) * this.options.take;
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

	this.options.skip = page2 * limit2;
	this.options.take = limit2;
	return this;
};

QBP.primarykey = function(val) {
	this.options.primarykey = val;
	return this;
};

QBP.skip = function(count) {
	this.options.skip = count;
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

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'in=' + name;
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

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'notin=' + name;
	t.filter.push({ type: 'notin', name: name, value: value });
	return t;
};

QBP.between = function(name, a, b) {
	var t = this;
	t.options.checksum += (t.options.checksum ? ' ' : '') + 'between=' + name;
	t.filter.push({ type: 'between', name: name, a: a, b: b });
	return t;
};

QBP.or = function(callback) {
	var t = this;
	var filter = t.filter;
	t.filter = [];
	t.options.checksum += (t.options.checksum ? ' ' : '') + 'or(';
	callback.call(t, t);
	if (t.filter.length) {
		filter.push({ type: 'or', value: t.filter });
	}
	t.options.checksum += ')';
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

	t.options.fields = arr;
	return t;
};

QBP.month = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'month' + comparer + name;
	t.filter.push({ type: 'month', name: name, comparer: comparer, value: value });
	return t;
};

QBP.day = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'day' + comparer + name;
	t.filter.push({ type: 'day', name: name, comparer: comparer, value: value });
	return t;
};

QBP.year = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'year' + comparer + name;
	t.filter.push({ type: 'year', name: name, comparer: comparer, value: value });
	return t;
};

QBP.hour = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'hour' + comparer + name;
	t.filter.push({ type: 'hour', name: name, comparer: comparer, value: value });
	return t;
};

QBP.minute = function(name, comparer, value) {
	var t = this;

	if (value === undefined) {
		value = comparer;
		comparer = '=';
	}

	t.options.checksum += (t.options.checksum ? ' ' : '') + 'minute' + comparer + name;
	t.filter.push({ type: 'minute', name: name, comparer: comparer, value: value });
	return t;
};

QBP.search = function(name, value, where) {
	var t = this;
	t.options.checksum += (t.options.checksum ? ' ' : '') + 'search=' + name + '=' + (where || '');
	t.filter.push({ type: 'search', name: name, comparer: where, value: value });
	return t;
};

QBP.contains = function(name) {
	var t = this;
	t.options.checksum += (t.options.checksum ? ' ' : '') + 'contains=' + name;
	t.filter.push({ type: 'contains', name: name });
	return t;
};

QBP.empty = function(name) {
	var t = this;
	t.options.checksum += (t.options.checksum ? ' ' : '') + 'empty=' + name;
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
		t.options.fields = newfields;

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
	if (!t.options.sort)
		t.options.sort = [];
	t.options.sort.push(sort + '_' + (type === true || type === 'desc' ? 'desc' : 'asc'));
	return t;
};

QBP.gridsort = function(sort) {

	var t = this;

	if (!t.options.sort)
		t.options.sort = [];

	var keys = sort.split(',');
	for (var key of keys) {
		key = key.trim();
		var index = key.lastIndexOf('_');
		t.options.sort.push(index === -1 ? (key + '_asc') : key);
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

	if (!t.options.fields)
		t.options.fields = [];

	if (fields) {
		fields = fields.replace(REG_FIELDS_CLEANER, '').split(',');
		for (var field of fields) {
			if (allowed && allowed.meta[field]) {
				t.options.fields.push(field);
				fieldscount++;
			}
		}
	}

	if (!fieldscount) {
		for (var field of allowed.keys)
			t.options.fields.push(field);
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

QBP.join = function(name, table, jointype, a, b) {
	var t = this;
	t.filter.push({ type: 'join', table: table, name: name, join: jointype, on: [a, b] });
	return t;
};

function pg_where(where, filter, operator) {

	var tmp;

	for (var item of filter) {
		switch (item.type) {
			case 'or':
				var tmp = [];
				pg_where(tmp, item.value, 'OR');
				where.length && where.push(operator);
				where.push('(' + tmp.join(' ') + ')');
				break;
			case 'in':
				where.length && where.push(operator);
				where.push(item.name + ' IN (' + PG_ESCAPE(item.value) + ')');
				break;
			case 'notin':
				where.length && where.push(operator);
				where.push(item.name + ' NOT IN (' + PG_ESCAPE(item.value) + ')');
				break;
			case 'where':
				where.length && where.push(operator);
				where.push(item.name + item.comparer + PG_ESCAPE(item.value));
				break;
			case 'contains':
				where.length && where.push(operator);
				where.push('LENGTH(' + item.name +'::text)>0');
				break;
			case 'search':
				where.length && where.push(operator);
				tmp = item.value.replace(/%/g, '');
				if (item.operator === 'beg')
					where.push(item.name + ' ILIKE ' + PG_ESCAPE('%' + tmp));
				else if (item.operator === 'end')
					where.push(item.name + ' ILIKE ' + PG_ESCAPE(tmp + '%'));
				else
					where.push(item.name + ' ILIKE ' + PG_ESCAPE('%' + tmp + '%'));
				break;
			case 'month':
			case 'year':
			case 'day':
			case 'hour':
			case 'minute':
				where.length && where.push(operator);
				where.push('EXTRACT(' + item.type + ' from ' + item.name + ')' + item.comparer + PG_ESCAPE(item.value));
				break;
			case 'empty':
				where.length && where.push(operator);
				where.push('(' + item.name + ' IS NULL OR LENGTH(' + item.name + '::text)=0)');
				break;
			case 'between':
				where.length && where.push(operator);
				where.push('(' + item.name + ' BETWEEN ' + PG_ESCAPE(item.a) + ' AND ' + PG_ESCAPE(item.b) + ')');
				break;
		}
	}
}

function pg_insertupdate(filter, insert) {

	var query = [];
	var fields = insert ? [] : null;
	var params = [];

	for (var key in filter.payload) {
		var val = filter.payload[key];
		var c = key[0];
		switch (c) {
			case '-':
			case '+':
			case '*':
			case '/':
				key = key.substring(1);
				params.push(val ? val : 0);
				if (insert) {
					fields.push(key);
					query.push('$' + params.length);
				} else
					query.push('"' + key + '"=COALESCE(' + key + ',0)' + c + '$' + params.length);
				break;
			case '>':
			case '<':
				key = key.substring(1);
				params.push(val ? val : 0);
				if (insert) {
					fields.push(key);
					query.push('$' + params.length);
				} else
					query.push('"' + key + '"=' + (c === '>' ? 'GREATEST' : 'LEAST') + '(' + key + ',$' + params.length + ')');
				break;
			case '!':
				// toggle
				key = key.substring(1);
				if (insert) {
					fields.push(key);
					query.push('FALSE');
				} else
					query.push('"' + key + '"=NOT ' + key);
				break;
			case '=':
			case '#':
				// raw
				key = key.substring(1);
				if (insert) {
					if (c === '=') {
						fields.push(key);
						query.push(val);
					}
				} else
					query.push('"' + key + '"=' + val);
				break;
			default:
				params.push(val);
				if (insert) {
					fields.push(key);
					query.push('$' + params.length);
				} else
					query.push('"' + key.substring(1) + '"=$' + params.length);
				break;
		}
	}

	return { fields, query, params };
}

QueryBuilderOptions.prototype.toPostgreSQL = function(exec) {

	var opt = this;
	var query = '';
	var where = [];
	var model = {};
	var params;
	var index;
	var tmp;

	if (!exec)
		exec = opt.exec;

	pg_where(where, opt.filter, 'AND');

	switch (exec) {
		case 'find':
		case 'read':
			query = 'SELECT ' + (opt.fields || '*') + ' FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
			break;
		case 'list':
			query = 'SELECT ' + (opt.fields || '*') + ' FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
			break;
		case 'count':
			opt.first = true;
			query = 'SELECT COUNT(1)::int as count FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
			break;
		case 'insert':
			tmp = pg_insertupdate(opt, true);
			query = 'INSERT INTO ' + opt.table + ' (' + tmp.fields.join(',') + ') VALUES(' + tmp.query.join(',') + ')' + (opt.primarykey ? ' RETURNING ' + opt.primarykey : '');
			params = tmp.params;
			break;
		case 'remove':
			query = 'DELETE FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
			break;
		case 'update':
			tmp = pg_insertupdate(opt, true);
			query = 'WITH rows AS (UPDATE ' + opt.table + ' SET ' + tmp.query.join(',') + (where.length ? (' WHERE ' + where.join(' ')) : '') + ' RETURNING 1) SELECT COUNT(1)::int count FROM rows';
			params = tmp.params;
			break;
		case 'drop':
			query = 'DROP TABLE ' + opt.table;
			break;
		case 'truncate':
			query = 'TRUNCATE TABLE ' + opt.table + ' RESTART IDENTITY';
			break;
		case 'command':
			break;
		case 'scalar':
			switch (opt.scalar.type) {
				case 'avg':
				case 'min':
				case 'sum':
				case 'max':
				case 'count':
					opt.first = true;
					var val = opt.scalar.key === '*' ? 1 : opt.scalar.key;
					query = 'SELECT ' + opt.scalar.type.toUpperCase() + (opt.scalar.type !== 'count' ? ('(' + val + ')') : '(1)') + '::int as count FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
					break;
				case 'group':
					query = 'SELECT ' + opt.scalar.key + ', ' + (opt.scalar.key2 ? ('SUM(' + opt.scalar.key2 + ')::numeric') : 'COUNT(1)::int') + ' as count FROM ' + opt.table + (where.length ? (' WHERE ' + where.join(' ')) : '');
					break;
			}
			break;
		case 'query':
			query = opt.table;
			break;
	}

	if (exec === 'find' || exec === 'read' || exec === 'list' || exec === 'query') {

		if (opt.sort) {
			query += ' ORDER BY ';
			for (var item of opt.sort) {
				index = item.lastIndexOf('_');
				query += item.substring(0, index) + ' ' + (item.substring(index + 1) === 'desc' ? 'DESC' : 'ASC');
			}
		}

		if (opt.take && opt.skip)
			query += ' LIMIT ' + opt.take + ' OFFSET ' + opt.skip;
		else if (opt.take)
			query += ' LIMIT ' + opt.take;
		else if (opt.skip)
			query += ' OFFSET ' + opt.skip;
	}

	model.query = query;
	model.params = params;

	return model;
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

function PG_ESCAPE(value) {

	if (value == null)
		return 'null';

	var type = typeof(value);

	if (type === 'function') {
		value = value();
		if (value == null)
			return 'null';
		type = typeof(value);
	}

	if (type === 'boolean')
		return value === true ? 'true' : 'false';

	if (type === 'number')
		return value.toString();

	if (type === 'string')
		return pg_escape(value);

	if (value instanceof Array)
		return pg_escape(value.join(','));

	if (value instanceof Date)
		return pg_escape(dateToString(value));

	return pg_escape(value.toString());
}

// Author: https://github.com/segmentio/pg-escape
// License: MIT
function pg_escape(val) {
	if (val == null)
		return 'NULL';
	var backslash = ~val.indexOf('\\');
	var prefix = backslash ? 'E' : '';
	val = val.replace(REG_PG_ESCAPE_1, '\'\'').replace(REG_PG_ESCAPE_2, '\\\\');
	return prefix + '\'' + val + '\'';
}

function dateToString(dt) {

	var arr = [];

	arr.push(dt.getFullYear().toString());
	arr.push((dt.getMonth() + 1).toString());
	arr.push(dt.getDate().toString());
	arr.push(dt.getHours().toString());
	arr.push(dt.getMinutes().toString());
	arr.push(dt.getSeconds().toString());

	for (var i = 1; i < arr.length; i++) {
		if (arr[i].length === 1)
			arr[i] = '0' + arr[i];
	}

	return arr[0] + '-' + arr[1] + '-' + arr[2] + ' ' + arr[3] + ':' + arr[4] + ':' + arr[5];
}