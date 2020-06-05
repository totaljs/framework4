function Database(type, name, fork) {
	var t = this;
	t.type = type;
	t.name = name;
	t.fork = fork || {};
	t.exec = function(builder) {
		builder.options.filter = builder.builder.length ? builder.builder.join('&&') : 'true';
		builder.options.type = type;
		builder.options.database = name;
		if (t.fork.cmd_find)
			t.fork['cmd_' + builder.command](builder.options, builder.$callback);
		else {
			var key = type + '_' + name;

			if (t.fork[key]) {
				t.fork[key][builder.command]().assign(builder.options).callback(builder.$callback);
				return;
			}

			var db = require('./textdb');
			t.fork[key] = type === 'nosql' ? db.JsonDB(name, PATH.databases()) : db.TableDB(name, PATH.databases(), CONF['table_' + name]);
			t.fork[key][builder.command]().assign(builder.options).callback(builder.$callback);
		}
	};
}

var DP = Database.prototype;

DP.next = function(builder) {
	setImmediate(this.exec, builder);
};

DP.scalar = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'scalar';
	this.next(builder);
	return builder;
};

DP.find = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find';
	this.next(builder);
	return builder;
};

DP.read = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find2';
	builder.options.take = 1;
	builder.options.first = 1;
	this.next(builder);
	return builder;
};

DP.count = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'count';
	this.next(builder);
	return builder;
};

DP.find2 = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'find2';
	this.next(builder);
	return builder;
};

DP.insert = function(data) {
	var builder = new DatabaseBuilder();
	builder.command = 'insert';
	builder.options.payload = data;
	this.next(builder);
	return builder;
};

DP.update = DP.modify = function(data) {

	var builder = new DatabaseBuilder();
	builder.command = 'update';

	var keys = Object.keys(data);
	var tmp = [];
	var arg = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var val = data[key];
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
	console.log(builder.options);
	this.next(builder);
	return builder;
};

DP.remove = function() {
	var builder = new DatabaseBuilder();
	builder.command = 'remove';
	this.next(builder);
	return builder;
};

DP.drop = function() {
};

DP.alter = function(schema, callback) {
};

DP.clear = function(callback) {
};

DP.clean = function(callback) {
};

function DatabaseBuilder() {
	var t = this;
	t.builder = [];
	t.options = { filterarg: { params: [] } };
}

var DB = DatabaseBuilder.prototype;

DB.callback = function(callback) {
	this.$callback = callback;
	return this;
};

DB.param = function(value) {
	return this.options.filterarg.params.push(value) - 1;
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
	callback();
	self.builder.length && builder.push('(' + self.builder.join('||') + ')');
	self.builder = builder;
	return self;
};

DB.fields = function(fields) {
	var self = this;
	self.options.fields = fields;
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

exports.make = function(type, name, fork) {
	return new Database(type, name, fork);
};