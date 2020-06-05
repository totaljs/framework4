// Copyright 2020 (c) Peter Širka <petersirka@gmail.com>
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
 * @module QueryBuilder
 * @version 1.0.0
 */

// Dependencies
const DButils = require('./utils');
const Fs = require('fs');
const NEWLINE = '\n';

var PROPCACHE = {};
var SORTCACHE = {};
var FUNCCACHE = {};

process.totaldbworker && setTimeout(function() {
	PROPCACHE = {};
	SORTCACHE = {};
	FUNCCACHE = {};
}, 60 * 1000 * 5); // 5 minutes cache

function errorhandling(err) {
}

var func = {};

func.in = function(a, b) {
	if (a instanceof Array) {
		for (var i = 0; i < a.length; i++) {
			if (b instanceof Array) {
				for (var j = 0; j < b.length; j++) {
					if (a[i] === b[j])
						return true;
				}
			} else if (a[i] === b)
				return true;
		}
	} else {
		if (b instanceof Array)
			return b.indexOf(a) !== -1;
		else if (a === b)
			return true;
	}
	return false;
};

function search(a, b, pos) {
	switch (pos) {
		case 'beg':
		case 1:
			return a.substring(0, b.length) === b;
		case 'end':
		case 2:
			return a.substring(a.length - b.length) === b;
		default:
			return a.indexOf(b) !== -1;
	}
}

func.search = function(a, b, pos) {

	if (!a || !b)
		return false;

	if (a instanceof Array) {
		for (var i = 0; i < a.length; i++) {
			if (!a[i])
				continue;
			var av = (a[i] + '').toLowerCase();
			if (b instanceof Array) {
				for (var j = 0; j < b.length; j++) {
					if (!b[j])
						continue;
					var bv = (b[j] + '').toLowerCase();
					if (search(av, bv, pos))
						return true;
				}
			} else if (search(av, (b + '').toLowerCase(), pos))
				return true;
		}
	} else {
		if (b instanceof Array) {
			for (var i = 0; i < b.length; i++) {
				if (!b[i])
					continue;
				var bv = (b[j] + '').toLowerCase();
				if (search(a, bv, pos))
					return true;
			}
			return b.indexOf(a) !== -1;
		} else {
			if (search((a + '').toLowerCase(), (b + '').toLowerCase(), pos))
				return true;
		}
	}
	return false;
};

// Dependencies
function QueryBuilder(db) {

	var t = this;
	t.tmp = {};
	t.db = db;
	t.response = [];
	t.count = 0;
	t.counter = 0;
	t.scanned = 0;
	t.$take = 1000;
	t.$skip = 0;

	t.func = func;

	// t.$fields
	// t.$sortname
	// t.$sortasc
}

QueryBuilder.prototype.assign = function(meta) {
	var self = this;
	self.cid = meta.cid;
	self.$first = meta.first;
	meta.fields && self.fields(meta.fields);
	meta.sort && self.sort(meta.sort);
	meta.take && self.take(meta.take);
	meta.skip && self.skip(meta.skip);
	meta.modify && self.modify(meta.modify, meta.modifyarg);
	meta.filter && self.filter(meta.filter, meta.filterarg);
	meta.scalar && self.scalar(meta.scalar, meta.scalararg);
	meta.backup && self.backup(meta.backup);
	meta.payload && (self.payload = meta.payload);
	meta.log && self.log(meta.log);

	if (meta.filter)
		self.filderid = meta.filter;

	return self;
};

QueryBuilder.prototype.fields = function(value) {
	var self = this;
	var tmp = PROPCACHE[value];
	if (!tmp) {
		self.$fieldsremove = [];
		self.$fields = [];
		var keys = value.split(',').trim();
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key[0] === '-')
				self.$fieldsremove.push(key.substring(1));
			else
				self.$fields.push(key);
		}
		tmp = { map: self.$fields.length ? self.$fields : null, rem: self.$fieldsremove.length ? self.$fieldsremove : null };
		PROPCACHE[value] = tmp;
		if (!self.$fields.length)
			self.$fields = null;
		if (!self.$fieldsremove.length)
			self.$fieldsremove = null;
	}
	self.$fields = tmp.map;
	self.$fieldsremove = tmp.rem;
	return self;
};

QueryBuilder.prototype.transform = function(rule, arg) {
	var self = this;
	if (arg)
		self.transformarg = arg;

	var key = 'T' + rule;
	var tmp = FUNCCACHE[key];
	if (tmp)
		self.transformrule = tmp;
	else {
		if (isdangerous(rule))
			rule = 'doc';
		FUNCCACHE[key] = self.transformrule = new Function('doc', 'arg', 'tmp', 'func', 'return ' + rule);
	}

	return self;
};

QueryBuilder.prototype.prepare = function(doc) {

	var self = this;
	var obj;

	if (self.$fields) {
		obj = {};
		for (var i = 0; i < self.$fields.length; i++) {
			var name = self.$fields[i];
			obj[name] = doc[name];
		}
	} else if (self.$fieldsremove) {
		obj = doc;
		for (var i = 0; i < self.$fieldsremove.length; i++)
			obj[self.$fieldsremove[i]] = undefined;
	}

	if (self.transformrule) {

		// Clone data
		if (!obj) {
			obj = {};
			var keys = Object.keys(doc);
			for (var i = 0; i < keys.length; i++)
				obj[keys[i]] = doc[keys[i]];
		}

		self.transformrule(obj, self.transformarg);
	}

	return obj || doc;
};

QueryBuilder.prototype.push = function(item) {
	var self = this;
	if (self.$sortname)
		return DButils.sort(self, item);
	self.response.push(item);
	return true;
};

QueryBuilder.prototype.take = function(take) {
	this.$take = take;
	return this;
};

QueryBuilder.prototype.skip = function(skip) {
	this.$skip = skip;
	return this;
};

QueryBuilder.prototype.sort = function(field) {
	var self = this;
	var tmp = SORTCACHE[field];

	if (!tmp) {
		var index = field.lastIndexOf('_');
		var tmp = {};
		tmp.name = field.substring(0, index);
		tmp.asc = field.substring(index + 1) !== 'desc';
		SORTCACHE[field] = tmp;
	}

	self.$sortname = tmp.name;
	self.$sortasc = tmp.asc;
	return self;
};

QueryBuilder.prototype.filter = function(rule, arg) {
	var self = this;

	self.filterarg = arg || {};

	var tmp = FUNCCACHE[rule];
	if (tmp)
		self.filterrule = tmp;
	else {
		if (isdangerous(rule))
			rule = 'false';
		try {
			FUNCCACHE[rule] = self.filterrule = new Function('doc', 'arg', 'tmp', 'func', 'return ' + prepare_filter(rule));
		} catch (e) {
			self.$sortname = null;
			self.$sortasc = null;
			self.error = e + '';
			self.filterrule = filterrule;
		}
	}

	return self;
};

function modifyrule(doc) {
	return doc;
}

function scalarrule() {
}

function filterrule() {
	return false;
}

QueryBuilder.prototype.modify = function(rule, arg) {
	var self = this;
	var tmp = FUNCCACHE[rule];

	self.modifyarg = arg || {};

	if (tmp)
		self.modifyrule = tmp;
	else {
		if (isdangerous(rule, true))
			rule = '';
		try {
			FUNCCACHE[rule] = self.modifyrule = rule ? new Function('doc', 'arg', 'tmp', 'func', rule) : modifyrule;
		} catch (e) {
			self.modifyrule = modifyrule;
			self.error = e + '';
		}
	}

	return self;
};

QueryBuilder.prototype.scalar = function(rule, arg) {
	var self = this;
	var tmp = FUNCCACHE[rule];

	self.scalararg = arg || {};

	if (tmp)
		self.scalarrule = tmp;
	else {
		if (isdangerous(rule))
			rule = '';
		try {
			FUNCCACHE[rule] = self.scalarrule = new Function('doc', 'arg', 'tmp', 'func', rule);
		} catch (e) {
			self.scalarrule = scalarrule;
			self.error = e + '';
		}
	}

	return self;
};

QueryBuilder.prototype.done = function() {
	var meta = {};
	//console.log(this);

	if (this.error)
		meta.error = this.error;

	meta.count = this.count;
	meta.counter = this.counter;
	meta.scanned = this.scanned;
	meta.duration = this.duration;

	if (this.inmemory)
		meta.inmemory = this.inmemory;

	if (this.canceled)
		meta.canceled = true;

	if (this.$first)
		this.response = this.response instanceof Array ? this.response[0] : this.response;

	this.$callback(null, this.response, meta);
};

QueryBuilder.prototype.callback = function(fn) {
	var self = this;
	self.$callback = fn;
	return self;
};

QueryBuilder.prototype.backup = function(meta) {
	var self = this;
	self.backuparg = meta || EMPTYOBJECT;
	self.backuprule = self.backupitem;
	return self;
};

QueryBuilder.prototype.log = function(data) {
	var self = this;
	data.date = new Date();
	self.logarg = JSON.stringify(data) + NEWLINE;
	self.logrule = self.logitem;
	return self;
};

// Internal
QueryBuilder.prototype.backupitem = function(item) {
	var self = this;
	self.backuparg.date = new Date();
	Fs.appendFile(self.db.filenameBackup, JSON.stringify(self.backuparg) + ' | ' + (typeof(item) === 'string' ? item : JSON.stringify(item)) + NEWLINE, errorhandling);
};

QueryBuilder.prototype.logitem = function() {
	var self = this;
	Fs.appendFile(self.db.filenameLog, self.logarg, errorhandling);
	return self;
};

function isdangerous(rule, modify) {
	return (/require|global/).test(rule);
}

function prepare_filter(value) {

	var skip = '';
	var last = '';
	var builder = [];
	var command = '';

	for (var i = 0; i < value.length; i++) {

		var c = value[i];

		if (skip && value[i - 1] !== '\\' && skip !== c) {
			builder.push(c);
			continue;
		}

		if (c === '\'') {
			skip = '\'';
			command = '';
		} else if (c === '"') {
			skip = '"';
			command = '';
		}

		if (c === ' ' || c === '\n')
			continue;

		if ((last === '+' || last === '-' || last === '*') && c === '=') {
			builder.pop();
			builder.push(c);
		}

		if (last === '=' && c !== '=')
			builder.push('=');

		//if ((/delete)\s/).test(command)) {
		//	replace.push(command);
		//	continue;
		//}

		builder.push(c);
		command += c;
		last = c;
	}

	return builder.join('');
}

exports.QueryBuilder = QueryBuilder;