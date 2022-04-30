// Supported:
// - condition: IF, ELSE, ELSE IF, FI
// - custom helpers: HELPERNAME(arg1, arg2)
// - user defined values: "1" (number), "TEXT" (text), "TRUE" (boolean), "FALSE" boolean, "YES" boolean, "NO" boolean
// - returning via return keyword
// - supports lower/upper case (but properties in the model/helpers must be in the lower case)
// - #temporary
/*
	IF something >= 10
		RETURN something * 10;
	FI
*/

exports.compile = function(str, nocompile) {

	var indexer = 0;
	var keywords = {};

	// User defined values
	str = str.replace(/".*?"/g, function(text) {

		var key = '@' + indexer + '@';

		text = text.substring(1, text.length - 1);
		if ((/^[0-9.,]+$/).test(text)) {
			text = text.parseFloat();
		} else {
			var boolean = text.toLowerCase();
			if (boolean === 'true' || boolean === 'false')
				text = boolean === 'true';
			else
				text = '"' + text + '"';
		}

		keywords[key] = text;
		indexer++;
		return key;
	});

	// Removes comments
	str = str.split('\n').map(line => line.replace(/\/\/.*?$/g, '')).join('\n');

	// Return
	str = str.replace(/(\s)?return(\s)?/ig, function(text) {
		var key = '@' + indexer + '@';
		keywords[key] = text.toLowerCase();
		indexer++;
		return key;
	});

	// End condition
	str = str.replace(/(\s)?fi(\s)?/ig, function(text) {
		return text.replace(/fi/i, '}');
	});

	// Boolean
	str = str.replace(/[\s+\-*/()=]?(true|false|yes|no)[\s+\-*/()=]/ig, function(text) {
		return text.toLowerCase().replace('yes', 'true').replace('no', false);
	});

	// AND OR
	str = str.replace(/(\s)(AND|OR)(\s)/ig, function(text) {
		text = text.toLowerCase();
		return text.replace(/and/g, '&&').replace(/or/g, '||');
	});

	// Conditions
	var lines = str.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var lower = line.toLowerCase();

		var index = lower.indexOf('else');
		if (index !== -1) {
			var tmp = line.substring(index);
			var tmplower = tmp.toLowerCase();
			line = line.substring(0, index) + '}' + tmp + (tmplower.indexOf('else if') === -1 ? '{' : '');
		}

		if (lower.indexOf('if ') !== -1) {
			lines[i] = line.replace(/.=./g, function(text) {
				if (text[0] === '>' || text[0] === '<' || text[0] === '=' || (text[1] === '=' && text[2] === '='))
					return text;
				if (text[2] === '>' || text[2] === '<')
					return text[2] + text[1] + text[0];
				if (text[1] === '=')
					return text[0] + '=' + text[1] + text[2];
				return text;
			}) + '){';
		} else if (index !== -1) {
			lines[i] = line;
		}
	}

	str = lines.join('\n');

	// Conditions
	str = str.replace(/(\s)?(else|else\sif|if)(\s)?/ig, function(text) {
		var key = '@' + indexer + '@';
		keywords[key] = text.replace(/if(\s)/i, 'if(').replace(/else/i, 'else');
		indexer++;
		return key;
	});

	// Null
	str = str.replace(/(\s)?(null)(\s)?/ig, function(text) {
		var key = '@' + indexer + '@';
		keywords[key] = text.replace(/null/i, 'null');
		indexer++;
		return key;
	});

	// Helpers
	str = str.replace(/[a-z0-9_]+\(/ig, function(text) {
		var key = '@' + indexer + '@';
		keywords[key] = 'helpers.' + text.toLowerCase();
		indexer++;
		return key;
	});

	// Temporary variables
	str = str.replace(/#[a-z0-9_.]+./ig, function(text) {

		var last = text[text.length - 1];
		if (last === '@')
			text = text.substring(0, text.length - 1);
		else
			last = '';

		var key = '@' + indexer + '@';
		keywords[key] = text.substring(1).toLowerCase().replace(/[a-z]/i, text => 'tmp.' + text);
		indexer++;
		return key + last;
	});

	// Properties & fixed values
	str = str.replace(/.[a-z0-9_.]+./ig, function(text) {

		if ((/@[0-9]+@|true|false/).test(text))
			return text;

		if ((/^[0-9.]+$/i).test(text)) {
			return text;
		}

		text = text.toLowerCase().replace(/[a-z]/i, function(text) {
			return 'model.' + text;
		});

		return text;
	});

	if ((/'|`/).test(str))
		return null;

	str = str.replace(/@\d+@/gi, function(text) {
		return keywords[text];
	});

	lines = str.split('\n').trim();
	str = '';

	for (var line of lines) {
		if (line.trim()) {
			// line = line.replace(/model\.[a-z0-9.]+(\s)?(>|<|=)+./g, text => text.replace(/\./g, '?.'));
			str += (str ? '\n' : '') + line;
		}
	}

	return nocompile ? str : new Function('model', 'helpers', 'var tmp={};' + str);
};