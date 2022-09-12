function HTMLElement() {
	this.children = [];
}

function parseRule(selector) {

	var rule = {};

	rule.attrs = [];
	rule.output = [];

	var index = selector.indexOf('>');

	if (index !== -1) {
		var nested = selector.substring(index + 1).trim();
		rule.nested = parseRule(nested);
		rule.nested.output = rule.output;
		selector = selector.substring(0, index).trim();
	}

	var match = selector.match(/[#|.][a-z-_0-9]+/i);
	if (match) {
		for (var m of match) {
			var val = m.substring(1);
			rule.attrs.push({ id: m[0] === '#' ? 'id' : 'class', value: val });
		}
		selector = selector.replace(match, '');
	}

	match = selector.match(/\[.*?\]/i);
	if (match) {
		for (var m of match) {
			index = m.indexOf('=');
			rule.attrs.push({ id: m.substring(1, index).trim(), value: m.substring(index + 2, m.length - 3).trim() });
		}
		selector = selector.replace(match, '');
	}

	rule.tagName = selector.toUpperCase();
	return rule;
}

HTMLElement.prototype.find = function(selector) {

	var self = this;
	var selectors = selector.split(',');
	var rules = [];
	var output = [];

	for (var sel of selectors)
		rules.push(parseRule(sel.trim()));

	var travelse = function(rule, children) {
		for (var node of children) {

			var skip = false;

			if (rule.tagName && rule.tagName !== node.tagName)
				skip = true;

			if (rule.attrs.length && !skip) {
				for (var attr of rule.attrs) {

					switch (attr.id) {
						case 'class':
							var tmp = node.attrs[attr.id];
							if (tmp) {
								tmp = tmp.split(' ');
								if (!tmp.includes(attr.value))
									skip = true;
							} else
								skip = true;
							break;

						default:
							if (node.attrs[attr.id] !== attr.value)
								skip = true;
							break;
					}

					if (skip)
						break;
				}
			}

			if (!skip && !rule.nested)
				rule.output.push(node);

			if (node.children)
				travelse(skip ? rule : (rule.nested || rule), node.children, skip ? false : !!rule.nested);
		}
	};

	for (var rule of rules) {
		travelse(rule, self.children);
		if (rule.output.length)
			output.push.apply(output, rule.output);
	}

	return output;
};

HTMLElement.prototype.attrd = function(name, value) {
	return this.attr('data-' + name, value);
};

HTMLElement.prototype.parsecache = function() {

	var self = this;
	if (self.cache)
		return self;

	self.cache = {};
	self.cache.css = {};
	self.cache.cls = {};

	var tmp = self.attrs.class;
	var arr;

	if (tmp) {
		arr = tmp.split(' ');
		for (var c of arr)
			self.cache.cls[c] = 1;
	}

	var tmp = self.attrs.style;
	if (tmp) {
		arr = tmp.split(';');
		for (var c of arr) {
			var a = c.split(':');
			self.cache.css[a[0]] = a[1];
		}
	}

	return self;
};

HTMLElement.prototype.stringifycache = function() {
	var self = this;
	self.attrs.class = Object.keys(self.cache.cls).join(' ');
	var tmp = [];
	for (var key in self.cache.css)
		tmp.push(key + ':' + self.cache.css[key]);
	self.attrs.style = tmp.join(';');
	return self;
};

HTMLElement.prototype.attr = function(name, value) {

	var self = this;

	if (value === undefined)
		return self.attrs[name];

	if (value == null || value == '')
		delete self.attrs[name];
	else
		self.attrs[name] = value + '';

	return self;
};

HTMLElement.prototype.aclass = function(cls) {
	var self = this;
	self.parsecache();
	var arr = cls.split(/\s|,/);
	for (var m of arr)
		self.cache.cls[m] = 1;
	self.stringifycache();
	return self;

};

HTMLElement.prototype.hclass = function(cls) {
	var self = this;
	self.parsecache();
	return self.cache.cls[cls] === 1;
};

HTMLElement.prototype.tclass = function(cls, value) {
	var self = this;
	self.parsecache();
	var arr = cls.split(/\s|,/);
	for (var m of arr) {
		if (self.cache.cls[m]) {
			if (!value)
				delete self.cache.cls[m];
		} else {
			if (value || value === undefined)
				self.cache.cls[m] = 1;
		}
	}
	self.stringifycache();
	return self;
};

HTMLElement.prototype.rclass = function(cls) {
	var self = this;
	self.parsecache();

	var arr = cls.split(/\s|,/);
	for (var m of arr)
		delete self.cache.cls[m];

	self.stringifycache();
	return self;
};

HTMLElement.prototype.css = function(key, value) {
	var self = this;
	self.parsecache();
	if (typeof(key) === 'object') {
		for (var k of key) {
			value = key[k];
			if (value)
				self.cache.css[k] = value;
			else
				delete self.cache.css[k];
		}
	} else {
		if (value)
			self.cache.css[key] = value;
		else
			delete self.cache.css[key];
	}
	self.stringifycache();
	return self;
};

HTMLElement.prototype.remove = function() {
	var self = this;
	if (self.parentNode) {
		var index = self.parentNode.children.indexOf(self);
		if (index !== -1)
			self.parentNode.children.splice(index, 1);
	}
	return self;
};

HTMLElement.prototype.append = function(str) {

	var self = this;
	var dom = parseHTML(str);

	for (var item of dom.children)
		self.children.push(item);

	return self;
};

HTMLElement.prototype.prepend = function(str) {

	var self = this;
	var dom = parseHTML(str);

	for (var item of dom.children)
		self.children.unshift(item);

	return self;
};

HTMLElement.prototype.toString = function(formatted) {

	var self = this;
	var builder = [];

	var travelse = function(children, level) {

		for (var item of children) {

			var indent = formatted && level ? ''.padLeft(level, '\t') : '';
			var tag = item.tagName.toLowerCase();
			var attrs = [];

			for (var key in item.attrs) {
				var val = item.attrs[key];
				if (!val && (key === 'class' || key.substring(0, 5) === 'data-' || key === 'id'))
					continue;
				attrs.push(key + (val ? ('="' + (val || '') + '"') : ''));
			}

			switch (item.tagName) {
				case 'TEXT':
					if (item.textContent)
						builder.push(indent + item.textContent);
					break;
				default:
					if (item.unpair) {
						builder.push(indent + '<' + tag + (attrs.length ? (' ' + attrs.join(' ')) : '') + ' />');
					} else {
						builder.push(indent + '<' + tag + (attrs.length ? (' ' + attrs.join(' ')) : '') + '>' + (item.children.length ? '' : ('</' + tag + '>')));
						if (item.children.length) {
							travelse(item.children, level + 1);
							builder.push(indent + '</' + tag + '>');
						}
					}
					break;
			}
		}
	};

	travelse(self.tagName ? [self] : self.children, 0);
	return builder.join(formatted ? '\n' : '');
};

function removeComments(html) {
	var tagBeg = '<!--';
	var tagEnd = '-->';
	var beg = html.indexOf(tagBeg);
	var end = 0;
	while (beg !== -1) {
		end = html.indexOf(tagEnd, beg + 4);

		if (end === -1)
			break;

		var comment = html.substring(beg, end + 3);
		html = html.replacer(comment, '');
		beg = html.indexOf(tagBeg, beg);
	}

	return html;
}

function parseHTML(html, trim) {

	var makeText = function(parent, str) {
		var obj = new HTMLElement();
		obj.tagName = 'TEXT';
		obj.children = [];
		obj.attrs = {};
		obj.textContent = str;
		obj.parentNode = parent;
		return obj;
	};

	var parseAttrs = function(str) {
		var attrs = str.match(/[a-z-0-9]+(=("|').*?("|'))?/g);
		var obj = {};
		if (attrs) {
			for (var m of attrs) {
				m = m.trim();
				var index = m.indexOf('=');
				var key, val;
				key = (index === -1 ? m : m.substring(0, index)).trim();
				val = index === -1 ? '' : m.substring(m.indexOf('"', index) + 1, m.lastIndexOf('"')).trim();
				obj[key] = val;
			}
		}
		return obj;
	};

	var parseElements = function(str, parent) {

		var counter = 0;
		var count = 0;
		var beg = str.indexOf('<');
		var end = -1;
		if (beg !== -1)
			end = str.indexOf('>', beg + 1);

		if (beg === -1 || end === -1)
			return '';

		var tmp;

		if (beg > 0) {
			tmp = str.substring(0, beg);

			if (trim)
				tmp = tmp.trim();

			if (tmp)
				parent.children.push(makeText(parent, tmp));
		}

		var node = str.substring(beg + 1, end);
		var dom = new HTMLElement();

		// Doctype?
		if (node[0] === '!')
			return str.substring(end + 1);

		if (node[node.length - 1] === '/') {
			node = node.substring(0, node.length - 1);
			dom.unpair = true;
		}

		var tag = node;
		var index = tag.indexOf(' ');

		if (tag === '/div') {
			console.log('ERROR', str);
			return;
		}

		// console.log('---->', tag);

		if (index > 0) {
			tag = tag.substring(0, index);
			node = node.substring(index + 1);
		} else
			node = '';

		dom.tagName = tag.toUpperCase();
		dom.children = [];
		dom.attrs = node ? parseAttrs(node) : {};
		dom.raw = tag;
		dom.parentNode = parent;

		parent.children.push(dom);
		str = str.substring(end + 1);

		// Unpair tags
		switch (dom.tagName) {
			case 'BR':
			case 'HR':
			case 'IMG':
			case 'META':
			case 'LINK':
			case 'INPUT':
				dom.unpair = true;
				return str;
		}

		var pos = 0;
		var tagBeg = '<' + dom.raw;
		var tagEnd = '</' + dom.raw + '>';

		while (true) {

			if (counter++ > 10000)
				break;

			beg = str.indexOf(tagBeg, pos);
			end = str.indexOf(tagEnd, pos);

			if (beg !== -1 && beg < end) {
				count++;
				pos = str.indexOf('>', beg);
			}

			if (beg === -1 || end < beg) {

				pos = end + tagEnd.length;

				if (count) {
					count--;
					continue;
				}

				break;
			}
		}

		var inner = str.substring(0, pos - tagEnd.length);

		if (inner.indexOf('<') === -1 || (/script|style|template/).test(tag)) {
			if (trim)
				inner = inner.trim();
			if (inner)
				dom.children.push(makeText(dom, inner));
		} else {
			while (inner)
				inner = parseElements(inner, dom);
		}

		str = str.substring(end + tagEnd.length, str.length);

		if (str && str.indexOf('<') === -1) {
			if (trim)
				str = str.trim();
			if (str)
				parent.children.push(makeText(parent, str));
		}

		return str;
	};

	html = removeComments(html);

	var dom = new HTMLElement();

	while (html)
		html = parseElements(html, dom);

	return dom;
}

exports.parseHTML = parseHTML;