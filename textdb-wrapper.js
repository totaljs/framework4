const SPECIAL = { clear: 1, clean: 1, drop: 1 };
const REG_FIELDS_CLEANER = /"|`|\||'|\s/g;
const Path = require('path');

function makedirectory(directory, main, id) {

	var val = (HASH(id, true) % 10000) + '';
	var diff = 4 - val.length;

	if (diff > 0) {
		for (var i = 0; i < diff; i++)
			val = '0' + val;
	}

	if (diff.length > 4)
		val = val.substring(0, 4);

	return Path.join(directory, main, val);
}

function Database(type, name, fork, onetime, schema) {

	var t = this;
	t.type = type;
	t.name = name;
	t.directory = Path.dirname(name);
	t.basename = Path.basename(name);
	t.schema = schema;

	t.fork = fork || {};
	t.onetime = onetime;
	t.exec = function(builder) {

		var name = t.name;
		if (builder.options) {

			if (builder.options.bulk) {
				for (var i = 0; i < builder.options.bulk.length; i++) {
					var bulk = builder.options.bulk[i];
					bulk.options.filter = bulk.builder.length ? bulk.builder.join('&&') : 'true';
					builder.options.bulk[i] = bulk.options;
				}
			}

			builder.options.onetime = t.onetime;
			builder.options.filter = builder.builder.length ? builder.builder.join('&&') : 'true';

			if (builder.options.relation) {
				var dir = makedirectory(t.directory, t.basename + '.relations', builder.options.relation[1]);
				name = Path.join(dir, builder.options.relation[1] + '_' + builder.options.relation[0] + '.nosql');
				if (builder.command === 'insert')
					PATH.mkdir(dir, true);
				builder.options.relation = undefined;
			}

			if (fork) {
				builder.options.type = t.type;
				builder.options.database = name;
			}
		}

		if (t.fork.cmd_find) {

			if (SPECIAL[builder.command]) {
				t.fork['cmd_' + builder.command](builder.options, builder.$callback);
				return;
			}

			switch (builder.command) {
				case 'alter':
					t.fork['cmd_' + builder.command](builder.options, builder.$callback);
					break;
				case 'lock':
					t.fork['cmd_' + builder.command](builder.options, function() {
						builder.$callback(() => t.fork.cmd_unlock(builder.options));
					});
					break;
				case 'memory':
					t.fork['cmd_' + builder.command](builder.options);
					break;
				case 'recount':
					t.fork['cmd_' + builder.command](builder.options);
					break;
				default:
					t.fork['cmd_' + builder.command](builder.options, builder.$custom ? builder.$custom() : builder.$error ? builder.callbackerror() : builder.$callback);
					break;
			}

		} else {

			var key = type + '_' + name;

			if (!t.fork[key]) {
				var db = require('./textdb');
				t.fork[key] = type === 'nosql' ? db.JsonDB(name, !t.onetime) : db.TableDB(name, schema, !t.onetime);
			}

			if (SPECIAL[builder.command]) {
				t.fork[key][builder.command](builder.$callback);
				return;
			}

			if (builder.command === 'lock') {
				t.fork[key][builder.command](builder.$callback);
				return;
			}

			if (builder.command === 'alter') {
				t.fork[key][builder.command](builder.schema, builder.$callback);
				return;
			}

			if (builder.command === 'memory') {
				t.fork[key][builder.command](builder.options.count, builder.options.size);
				return;
			}

			if (builder.command === 'recount') {
				t.fork[key][builder.command](builder.$callback);
				return;
			}

			if (builder.options && builder.options.bulk) {
				var b;
				for (var i = 0; i < builder.options.bulk.length; i++) {
					var bi = builder.options.bulk[i];
					b = t.fork[key][builder.command]().assign(bi).$callback = bi.$custom ? bi.$custom() : bi.$callback;
				}
				if (b)
					b.$callback2 = builder.$callback;
			} else
				t.fork[key][builder.command]().assign(builder.options).$callback = builder.$custom ? builder.$custom() : builder.$error ? builder.callbackerror() : builder.$callback;
		}
	};

	if (fork && schema)
		t.fork.cmd_alter({ schema: schema, onetime: t.onetime, type: t.type, database: name });
}

var DP = Database.prototype;

DP.next = function(builder) {
	setImmediate(this.exec, builder);
	return this;
};

DP.find = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find';
	this.next(builder);
	return builder;
};

DP.backups = function(callback) {
	var builder = new DatabaseBuilder();
	builder.command = 'backups';
	this.next(builder);
	callback && builder.callback(callback);
	return builder;
};

DP.recount = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'recount';
	return this.next(builder);
};

function listing(builder, items, response) {
	var skip = builder.options.skip || 0;
	var take = builder.options.take || 0;
	return { page: skip && take ? ((skip / take) + 1) : 1, pages: response.count && take ? Math.ceil(response.count / take) : response.count ? 1 : 0, limit: take, count: response.count, items: items || [] };
}

DP.list = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find';
	builder.$custom = function() {
		return function(err, response, meta) {
			builder.$callback && builder.$callback(err, listing(builder, response, meta), meta);
		};
	};
	this.next(builder);
	return builder;
};

DP.lock = function(callback) {
	var builder = new DatabaseBuilder();
	builder.command = 'lock';
	builder.$callback = callback;
	this.next(builder);
};

DP.read = DP.one = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find2';
	builder.options.take = 1;
	builder.options.first = 1;
	this.next(builder);
	return builder;
};

DP.count = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find';
	builder.options.scalar = 'arg.count+=1';
	builder.options.scalararg = { count: 0 };
	this.next(builder);
	return builder;
};

DP.scalar = function(type, key) {
	var builder = new DatabaseBuilder();
	builder.command = 'find';

	switch (type) {
		case 'min':
		case 'max':
		case 'sum':
			builder.options.scalar = 'if (doc.{0}!=null){tmp.val=doc.{0};arg.count+=1;arg.min=arg.min==null?tmp.val:arg.min>tmp.val?tmp.val:arg.min;arg.max=arg.max==null?tmp.val:arg.max<tmp.val?tmp.val:arg.max;if (!(tmp.val instanceof Date))arg.sum+=tmp.val}'.format(key);
			builder.options.scalararg = { count: 0, sum: 0 };
			break;
		case 'group':
			builder.options.scalar = 'if (doc.{0}!=null){tmp.val=doc.{0};arg[tmp.val]=(arg[tmp.val]||0)+1}'.format(key);
			builder.options.scalararg = {};
			break;
	}

	//builder.options.scalar = 'arg.count+=1';
	//builder.options.scalararg = { count: 0 };
	this.next(builder);
	return builder;
};

DP.memory = function(count, size) {
	var builder = new DatabaseBuilder();
	builder.command = 'memory';
	builder.options.count = count;
	builder.options.size = size;
	this.next(builder);
};

DP.find2 = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find2';
	this.next(builder);
	return builder;
};

DP.insert = function(data, check, noeval) {

	var self = this;
	var bi = new DatabaseBuilder();
	bi.command = 'insert';
	bi.options.payload = data;

	if (check) {
		var builder = new DatabaseBuilder();
		builder.command = 'find2';
		builder.options.take = 1;
		builder.options.first = 1;
		builder.$custom = function() {
			return function(err, response, meta) {
				if (response) {
					builder.$callback && builder.$callback(err, 0, meta);
				} else {
					bi.$callback = builder.$callback;
					self.next(bi);
				}
			};
		};

		self.next(builder);
		return builder;

	} else if (!noeval)
		self.next(bi);

	return bi;
};

DP.bulkinsert = function(fn) {
	var self = this;
	var builder = new DatabaseBuilder();
	builder.command = 'insert';
	builder.options.bulk = [];

	var make = function(data) {
		var b = self.insert(data, false, true);
		builder.options.bulk.push(b);
		return b;
	};

	fn(make);

	this.next(builder);
	return builder;
};

DP.bulkupdate = DP.bulkmodify = function(fn) {

	var self = this;
	var builder = new DatabaseBuilder();
	builder.command = 'update';
	builder.options.bulk = [];

	var make = function(data, upsert) {
		var b = self.update(data, upsert, true);
		builder.options.bulk.push(b);
		return b;
	};

	fn(make);

	self.next(builder);
	return builder;
};

DP.bulkremove = function(fn) {

	var self = this;
	var builder = new DatabaseBuilder();
	builder.command = 'remove';
	builder.options.bulk = [];

	var make = function() {
		var b = self.remove(true);
		builder.options.bulk.push(b);
		return b;
	};

	fn(make);

	self.next(builder);
	return builder;
};

DP.update = DP.modify = function(data, upsert, noeval) {

	var self = this;
	var builder = new DatabaseBuilder();
	builder.command = 'update';

	var keys = Object.keys(data);
	var tmp = [];
	var arg = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var val = data[key];

		if (val === undefined)
			continue;

		var cmd;

		switch (key[0]) {
			case '+':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?0:doc.{0})+arg.{0}';
				break;
			case '*':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?0:doc.{0})*arg.{0}';
				break;
			case '-':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?0:doc.{0})-arg.{0}';
				break;
			case '/':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?0:doc.{0})/arg.{0}';
				break;
			case '!':
				key = key.substring(1);
				cmd = 'doc.{0}=!doc.{0}';
				break;
			case '=':
				key = key.substring(1);
				cmd = 'doc.{0}=' + data[key];
				break;
			case '<':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?arg.{0}:doc.{0}<arg.{0}?arg.{0}:doc.{0})';
				break;
			case '>':
				key = key.substring(1);
				cmd = 'doc.{0}=(doc.{0}==null?arg.{0}:doc.{0}>arg.{0}?arg.{0}:doc.{0})';
				break;
			default:
				cmd = 'doc.{0}=arg.{0}';
				break;
		}

		arg[key] = val;
		cmd && tmp.push(cmd.format(key));
	}

	if (tmp.length)
		builder.options.modify = tmp.join(';');

	builder.options.modifyarg = arg;

	if (upsert) {
		builder.$custom = function() {
			return function(err, response, meta) {
				if (response) {
					builder.$callback && builder.$callback(err, response, meta);
				} else {
					builder.$upsert && builder.$upsert(arg, builder);
					var bi = new DatabaseBuilder();
					bi.command = 'insert';
					bi.options.payload = arg;
					bi.$callback = builder.$callback;
					self.next(bi);
				}
			};
		};
	}

	if (!noeval)
		self.next(builder);

	return builder;
};

DP.remove = function(noeval) {
	var builder = new DatabaseBuilder();
	builder.command = 'remove';
	if (!noeval)
		this.next(builder);
	return builder;
};

DP.drop = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'drop';
	this.next(builder);
	return builder;
};

DP.alter = function(schema, callback) {
	var builder = new DatabaseBuilder();
	builder.command = 'alter';
	builder.schema = schema;
	builder.$callback = callback;
	return this.next(builder);
};

DP.clear = function(callback) {
	var builder = new DatabaseBuilder();
	builder.command = 'clear';
	builder.$callback = callback;
	this.next(builder);
	return builder;
};

DP.clean = function(callback) {
	var builder = new DatabaseBuilder();
	builder.command = 'clean';
	builder.$callback = callback;
	return this.next(builder);
};

DP.command = function(command, options, callback) {
	var builder = new DatabaseBuilder();
	builder.command = command;
	builder.options = options;
	builder.$callback = callback;
	this.next(builder);
	return builder;
};

function DatabaseBuilder() {
	var t = this;
	t.builder = [];
	t.options = { filterarg: { params: [] } };
	//t.joins;
}

var DB = DatabaseBuilder.prototype;

DB.insert = function(fn) {
	this.$upsert = fn;
	return this;
};

DB.callback = function(callback, err) {
	this.$callback = callback;
	this.$error = err;
	return this;
};

DB.callbackerror = function() {
	var self = this;
	return function(err, response) {
		if (response == null || response === 0 || (response instanceof Array && !response.length))
			err = self.$error;
		self.$callback && self.$callback(err, response);
	};
};

DB.param = function(value) {
	return this.options.filterarg.params.push(value) - 1;
};

DB.id = function(id) {
	return id instanceof Array ? this.in('id', id) : this.where('id', id);
};

DB.where = function(name, operator, value) {

	var self = this;

	if (value === undefined) {
		value = operator;
		operator = '==';
	}

	switch (operator) {
		case '=':
			operator = '==';
			break;
		case '<>':
			operator = '!=';
			break;
	}

	self.builder.push('doc.' + name + operator + 'arg.params[' + self.param(value) + ']');
	return self;
};

DB.backup = function(data) {
	this.options.backup = data;
	return this;
};

DB.log = function(data) {
	this.options.log = data;
	return this;
};

DB.rule = function(code, arg) {
	var self = this;

	if (arg) {
		var keys = Object.keys(arg);
		for (var i = 0; i < keys.length; i++)
			self.options.filterarg[keys[i]] = arg[keys[i]];
	}

	self.builder.push(code);
	return self;
};

DB.take = function(count) {
	this.options.take = count;
	return this;
};

DB.first = function() {
	this.options.first = 1;
	return this;
};

DB.limit = function(count) {
	this.options.take = count;
	return this;
};

DB.page = function(page, limit) {
	if (limit)
		this.options.take = limit;
	this.options.skip = page * this.options.take;
	return this;
};

DB.paginate = function(page, limit, maxlimit) {

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

DB.skip = function(count) {
	this.options.skip = count;
	return this;
};

DB.in = function(name, value) {
	var self = this;
	self.builder.push('func.in(doc.' + name + ',arg.params[' + self.param(value) + '])');
	return self;
};

DB.notin = function(name, value) {
	var self = this;
	self.builder.push('!func.in(doc.' + name + ',arg.params[' + self.param(value) + '])');
	return self;
};

DB.between = function(name, a, b) {
	var self = this;
	var ia = self.param(a);
	var ib = self.param(b);
	self.builder.push('(doc.' + name + '>=arg.params[' + ia + ']&&doc.' + name + '<=arg.params[' + ib + '])');
	return self;
};

DB.or = function(callback) {
	var self = this;
	var builder = self.builder;
	self.builder = [];
	callback.call(self, self);
	self.builder.length && builder.push('(' + self.builder.join('||') + ')');
	self.builder = builder;
	return self;
};

DB.fields = function(fields) {
	var self = this;
	self.options.fields = fields;
	return self;
};

DB.sort = function(sort) {
	var self = this;
	self.options.sort = sort;
	return self;
};

DB.month = function(name, operator, value) {
	var self = this;
	if (value === undefined) {
		value = operator;
		operator = '=';
	}
	self.builder.push(compare_datetype('month', name, self.param(value), operator));
	return self;
};

DB.day = function(name, operator, value) {
	var self = this;
	if (value === undefined) {
		value = operator;
		operator = '=';
	}
	self.builder.push(compare_datetype('day', name, self.param(value), operator));
	return self;
};

DB.year = function(name, operator, value) {
	var self = this;
	if (value === undefined) {
		value = operator;
		operator = '=';
	}
	self.builder.push(compare_datetype('year', name, self.param(value), operator));
	return self;
};

DB.hour = function(name, operator, value) {
	var self = this;
	if (value === undefined) {
		value = operator;
		operator = '=';
	}
	self.builder.push(compare_datetype('hour', name, self.param(value), operator));
	return self;
};

DB.minute = function(name, operator, value) {
	var self = this;
	if (value === undefined) {
		value = operator;
		operator = '=';
	}
	self.builder.push(compare_datetype('minute', name, self.param(value), operator));
	return self;
};

DB.search = function(name, value, where) {
	var self = this;
	var paramindex = self.param(value);
	self.builder.push('func.search(doc.' + name + ',arg.params[' + paramindex + ']' + (where == 'beg' ? ',1' : where == 'end' ? ',2' : '') + ')');
	return self;
};

DB.contains = function(name) {
	var self = this;
	self.builder.push('(doc.{0} instanceof Array?!!doc.{0}.length:!!doc.{0})'.format(name));
	return self;
};

DB.empty = function(name) {
	var self = this;
	self.builder.push('(doc.{0} instanceof Array?!doc.{0}.length:!doc.{0})'.format(name));
	return self;
};

function compare_datetype(type, key, paramindex, operator) {
	switch (operator) {
		case '=':
			operator = '==';
			break;
		case '<>':
			operator = '!=';
			break;
	}
	switch (type) {
		case 'day':
			type = 'getDate()';
			break;
		case 'month':
			type = 'getMonth()+1';
			break;
		case 'year':
			type = 'getFullYear()';
			break;
		case 'hour':
			type = 'getHour()';
			break;
		case 'minute':
			type = 'getMinute()';
			break;
	}
	return 'doc.{0}&&doc.{0}.getTime?doc.{0}.{3}{2}arg.params[{1}]:false'.format(key, paramindex, operator, type);
}

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

DB.gridfields = function(fields, allowed) {

	var self = this;
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
		self.options.fields = newfields.join(',');

	return self;
};

// Grid filtering
DB.gridfilter = function(name, obj, type, key) {

	var builder = this;
	var value = obj[name];
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

		for (var i = 0, length = arr.length; i < length; i++)
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

// Grid sorting
DB.gridsort = function(sort) {
	var self = this;
	self.options.sort = sort;
	return self;
};

DB.autofill = function($, allowedfields, skipfilter, defsort, maxlimit, localized) {

	if (typeof(defsort) === 'number') {
		maxlimit = defsort;
		defsort = null;
	}

	var self = this;
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

			if (localized)
				localized = localized.split(',');

			tmp = allowedfields.split(',').trim();
			for (var i = 0; i < tmp.length; i++) {
				var k = tmp[i].split(':').trim();
				obj[k[0]] = 1;

				if (localized && localized.indexOf(k[0]) !== -1)
					arr.push(k[0] + '§');
				else
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
				newfields.push(fields[i]);
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
			for (var i = 0; i < allowed.keys.length; i++)
				newfields.push(allowed.keys[i]);
		}
		if (schema.fields) {
			for (var i = 0; i < schema.fields.length; i++) {
				if (skipped && skipped[schema.fields[i]])
					continue;
				newfields.push(schema.fields[i]);
			}
		}
	}

	if (allowed && allowed.filter) {
		for (var i = 0; i < allowed.filter.length; i++) {
			tmp = allowed.filter[i];
			self.gridfilter(tmp.name, query, tmp.type);
		}
	}

	if (schema.fields) {
		for (var i = 0; i < schema.fields.length; i++) {
			var name = schema.fields[i];
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
				self.gridfilter(name, query, type);
			}
		}
	}

	if (query.sort) {
		var index = query.sort.lastIndexOf('_');
		if (index !== -1) {
			var name = query.sort.substring(0, index);
			var can = true;

			if (skipped && skipped[name])
				can = false;

			if (can && allowed && !allowed.meta[name])
				can = false;

			if (can && !allowed) {
				if (!schema.schema[name])
					can = false;
			} else if (!can)
				can = !!schema.schema[name];

			if (can)
				self.sort(name, query.sort[index + 1] === 'd');
			else if (defsort)
				self.gridsort(defsort);

		} else if (defsort)
			self.gridsort(defsort);

	} else if (defsort)
		self.gridsort(defsort);

	maxlimit && self.paginate(query.page, query.limit, maxlimit || 50);
	return self;
};

DB.relation = function(name, id) {
	this.options.relation = [name, id];
	return this;
};

DB.join = function(field, db) {

	var self = this;
	var builder = new DatabaseBuilder();
	builder.command = 'find';

	if (!self.joins) {
		self.$custom = DB.$callbackjoin;
		self.joins = [];
	}

	self.joins.push({ field: field, db: db, builder: builder, in: [] });

	builder.callback = function(callback) {
		self.$callback = callback;
		return builder;
	};

	return builder;
};

DB.on = function(a, b) {
	this.$on = [a, b];
	return this;
};

DB.$callbackjoin = function() {
	var self = this;
	return function(err, response, meta) {

		var one = response && !(response instanceof Array);

		if (!response) {
			self.$callback(null, response, meta);
			return;
		}

		if (one)
			response = [response];
		else if (!response.length) {
			self.$callback(null, response, meta);
			return;
		}

		for (var i = 0; i < response.length; i++) {
			for (var j = 0; j < self.joins.length; j++) {
				var join = self.joins[j];
				var val = response[i][join.builder.$on[1]];
				if (val != null && join.in.indexOf(val) === -1)
					join.in.push(val);
			}
		}

		self.joins.wait(function(join, next) {

			var first = join.builder.options.first;
			var take = join.builder.options.take;
			var skip = join.builder.options.skip;

			if (first)
				join.builder.options.first = undefined;

			if (take)
				join.builder.options.take = undefined;

			if (skip)
				join.builder.options.skip = undefined;

			join.builder.$callback = function(err, items, m) {

				for (var i = 0; i < response.length; i++) {
					var doc = response[i];
					var b = doc[join.builder.$on[1]];
					doc[join.field] = b ? items.findAll(join.builder.$on[0], b) : [];

					if (skip)
						doc[join.field] = doc[join.field].skip(skip);

					if (take)
						doc[join.field] = doc[join.field].take(take);

					if (first && doc[join.field])
						doc[join.field] = doc[join.field][0] || null;
				}

				meta.counter2 = (meta.counter2 || 0) + m.counter;
				meta.count2 = (meta.count2 || 0) + m.count;
				meta.scanned2 = (meta.scanned2 || 0) + m.scanned;
				meta.duration2 = (meta.duration2 || 0) + m.duration;
				next();
			};

			join.builder.in(join.builder.$on[0], join.in);
			join.db.next(join.builder);
		}, () => self.$callback(null, response, meta), 5);
	};
};

exports.make = function(type, name, fork, onetime, schema) {
	return new Database(type, name, fork, onetime, schema);
};

exports.makebuilder = function() {
	return new DatabaseBuilder();
};