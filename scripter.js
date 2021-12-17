require('./index');

// Scripter
function Scripter() {
	var t = this;
	t.rules = {};
	t.parser = {};
	t.rules.and = 'and';
	t.rules.or = 'or';
	t.rules.if = 'if';
	t.rules.else = 'else';
	t.rules.elseif = 'else if';
	t.rules.fi = 'fi';
	t.rules.return = 'return';
	t.parser.value = ['"', '"'];
	t.parser.operators = { '+': 1, '-': 1, '/': 1, '*': 1, '%': 1, '=': 1, '>': 1, '<': 1 };
	t.parser.separators = { ' ': 1, '\t': 1, '\n': 1, '\r': 1, ',': 1, ';': 1 };
	t.parser.scopes = { '\n': 1, ',': 1, ';': 1 };
	t.parser.boolean = { 'true': 1, 'false': 0, 'yes': 1, 'no': 0 };
	t.parser.special = { search: '' };
}

var SP = Scripter.prototype;

SP.clean = function(str) {

	var self = this;
	var commands = [];
	var index = 0;
	var is = false;
	var cmd;

	for (var i = 0; i < str.length; i++) {

		var c = str[i];

		if (self.parser.separators[c]) {

			if (is) {
				cmd = str.substring(index, i).trim();
				cmd && commands.push(cmd);
				is = false;

				if (self.parser.scopes[c]) {
					if (commands.length && commands[commands.length - 1] !== '@')
						commands.push('@');
				}

			}
			continue;
		}

		if (!is) {
			is = true;
			index = i;
		}

	}

	return commands;
};

SP.compile = function(str) {

	var self = this;
	var clean = ' ' + self.clean(str).join(' ') + ' ';
	var commands = [];
	var state = '';
	var index;

	for (var i = 0; i < clean.length; i++) {

		var c = clean[i];
		var prev = clean[i - 1];

		if (!state && (prev === '=' || prev === '>' || prev === '<')) {
			if (c === '=' || c === '>' || c === '<')
				clean = clean.substring(0, i - 1) + (c === '=' ? (prev + c) : (c + prev)) + clean.substring(i + 1);
		}

		if (!state && (c === '(' || c === ')'))
			commands.push(c);

		if (state === 'value') {
			if (c === self.parser.value[1]) {
				var val = clean.substring(index, i);
				var lower = val.toLowerCase();
				var type = self.parser.boolean[lower] != null ? 'boolean' : (/^[0-9,.]+$/).test(val) ? 'number' : 'string';
				var output = val;

				if (type === 'number')
					output = val.parseFloat();
				else if (type === 'boolean')
					output = self.parser.boolean[lower] == 1;

				commands.push({ value: output, type: type });
				state = '';
			}
			continue;

		} else if (c === self.parser.value[0]) {

			if (state === 'command')
				commands.push(clean.substring(index, i));

			state = 'value';
			index = i + 1;
			continue;
		}

		if ((/[a-z._]/i).test(c)) {
			if (state !== 'command') {
				state = 'command';
				index = i;
			}
			continue;
		}

		if (state === 'command') {
			commands.push(clean.substring(index, i));
			state = '';
		}

		if (c === '@') {
			commands.push(c);
			continue;
		}

		if (self.parser.operators[c]) {
			commands.push(c);
			continue;
		}
	}

	var variables = {};
	var values = [];
	var builder = [];
	var isif = false;
	var isop = false;

	for (var i = 0; i < commands.length; i++) {

		var cmd = commands[i];

		if (typeof(cmd) === 'string') {

			if (cmd === '@') {
				// new line
				if (isif) {
					builder.push('){');
					isif = false;
				} else
					builder.push(';');
				isop = false;
				continue;
			}

			if (cmd === '(' || cmd === ')') {
				builder.push(cmd);
				continue;
			}

			var rule = null;

			for (var key in self.rules) {
				if (self.rules[key] === cmd.toLowerCase()) {
					rule = key;
					break;
				}
			}

			if (rule) {
				switch (rule) {
					case 'if':
						isif = true;
						builder.push('if(');
						break;
					case 'else':
						builder.push('}');
						break;
					case 'elseif':
						isif = true;
						builder.push('else if(');
						break;
					case 'fi':
						builder.push('}');
						break;
					case 'return':
						builder.push('return ');
						break;
					case 'and':
						builder.push('&&');
						break;
					case 'or':
						builder.push('||');
						break;
				}

				isop = false;

			} else {
				if (self.parser.operators[cmd]) {
					if (isif) {
						prev = builder[builder.length - 1];
						if (cmd === '=' && prev !== '>' && prev !== '<')
							cmd = '==';
					}
					builder.push(cmd);
					isop = true;
				} else {
					cmd = cmd.toLowerCase();
					variables[cmd] = '';
					builder.push('model' + (isop ? '?.' : '.') + cmd);
				}
			}
		} else
			builder.push('values[' + (values.push(cmd.value) - 1) + ']');
	}

	var obj = {};
	obj.compiled = new Function('model', 'values', 'helpers', builder.join(''));
	obj.values = values;
	obj.helpers = {};
	obj.variables = Object.keys(variables);
	obj.exec = function(model) {

		for (var key of this.variables) {
			if (model[key] == null)
				model[key] = '';
		}

		return this.compiled(model, obj.values, obj.helpers);
	};

	return obj;
};


var scripter = new Scripter();
var meta = scripter.compile(`

	IF (subject>="9") AND terms="TRUE" AND terms SEARCH "kokot"
		age = age + "10"
	FI

	RETURN "1";
`);


var model = { age: 1, subject: 10, address: { name: '' }, terms: true };
console.log('--->', meta.exec(model));
console.log(model);
// console.log(model);

/*
if (state === 'value') {
	if (c === self.rules.value[1]) {
		values.push(scr.substring(index, i));
		state = '';
	}
} else if (c === self.rules.value[0]) {
	state = 'value';
	index = i + 1;
}*/
