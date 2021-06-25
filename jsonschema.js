require('./index');

function check_string(meta, error, value) {

	var type = typeof(val);
	if (type !== 'string')
		value = value ? (value + '') : null;

	if (meta.$$REQUIRED && !value) {
		error.push(meta.$$ID + '.required');
		return;
	}

	if (value == null)
		return;

	var len = value.length;

	if (meta.maxLength && len > meta.maxLength) {
		error.push(meta.$$ID + '.maxlength');
		return;
	}

	if (meta.minLength && len < meta.minLength) {
		error.push(meta.$$ID + '.minlength');
		return;
	}

	if (meta.enum instanceof Array) {
		if (meta.enum.indexOf(value) === -1) {
			error.push(meta.$$ID + '.enum');
			return;
		}
	}

	return value;
}

const REG_NUMBER = /[\d,\.]+/g;

function check_number(meta, error, value) {

	var type = typeof(value);

	if (type === 'string') {
		if (REG_NUMBER.test(value))
			value = value.parseFloat();
		else
			value = null;
	} else if (type !== 'number')
		value = null;

	if (meta.$$REQUIRED) {
		if (value == null) {
			error.push(meta.$$ID + '.required');
			return;
		}
	}

	if (value == null)
		return;

	if (meta.multipleOf) {
		if (value % meta.multipleOf !== 0) {
			error.push(meta.$$ID + '.multipleof');
			return;
		}
	}

	if (meta.maximum) {
		if (value > meta.maximum) {
			error.push(meta.$$ID + '.maximum');
			return;
		}
	}

	if (meta.exclusiveMaximum) {
		if (value >= meta.exclusiveMaximum) {
			error.push(meta.$$ID + '.exclusivemaximum');
			return;
		}
	}

	if (meta.minimum) {
		if (value < meta.minimum) {
			error.push(meta.$$ID + '.minimum');
			return;
		}
	}

	if (meta.exclusiveMinimum) {
		if (value <= meta.exclusiveMinimum) {
			error.push(meta.$$ID + '.exclusiveminimum');
			return;
		}
	}

	return value;
}

function check_boolean(meta, error, value) {

	var type = typeof(value);
	if (type !== 'boolean')
		value = value ? (value + '').parseBoolean() : null;

	if (meta.$$REQUIRED) {
		if (value == null) {
			error.push(meta.$$ID + '.required');
			return;
		}
	}

	if (value != null)
		return value;
}

function check_date(meta, error, value) {

	if (!(value instanceof Date))
		value = value ? (value + '').parseDate() : null;

	if (value && value instanceof Date && !(value.getTime()>0))
		value = null;

	if (meta.$$REQUIRED) {
		if (value == null) {
			error.push(meta.$$ID + '.required');
			return;
		}
	}

	if (value != null)
		return value;
}

function check_array(meta, error, value, stop) {

	if (!(value instanceof Array)) {
		if (meta.$$REQUIRED)
			error.push(meta.$$ID + '.required');
		return;
	}

	if (!value.length) {
		if (meta.$$REQUIRED) {
			error.push(meta.$$ID +  '.required');
			return;
		}
		return value;
	}

	var response;
	var tmp;

	if (meta.items instanceof Array) {

		for (var i = 0; i < value.length; i++) {
			var val = value[i];
			var type = meta.items[i];

			if (type) {
				switch (type) {
					case 'number':
					case 'integer':
					case 'float':
					case 'decimal':
						tmp = check_number(type, error, val);
						if (tmp != null) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
					case 'boolean':
					case 'bool':
						tmp = check_boolean(type, error, val);
						if (tmp != null) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
					case 'date':
						tmp = check_date(type, error, val);
						if (tmp != null) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
					case 'string':
						tmp = check_string(type, error, val);
						if (tmp != null) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
					case 'object':
						tmp = check_object(type, error, val, null, stop);
						if (tmp != null) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
					case 'array':
						tmp = check_array(type, error, value);
						if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1)) {
							response.push(tmp);
							break;
						} else {
							error.push(meta.$$ID + '.type');
							return;
						}
				}
			} else if (!type && !meta.additionalItems) {
				error.push(meta.$$ID + '.additionalitems');
				return;
			}
		}
	} else if (meta.items) {

		response = [];

		for (var i = 0; i < value.length; i++) {
			var val = value[i];
			switch (meta.items.type) {
				case 'number':
				case 'integer':
					tmp = check_number(meta.items, error, val);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
				case 'boolean':
				case 'bool':
					tmp = check_boolean(meta.items, error, val);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
				case 'date':
					tmp = check_date(meta.items, error, val);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
				case 'string':
					tmp = check_string(meta.items, error, val);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
				case 'object':
					tmp = check_object(meta.items, error, val, null, stop);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
				case 'array':
					tmp = check_array(meta.items, error, value, stop);
					if (tmp != null && (!meta.uniqueItems || response.indexOf(tmp) === -1))
						response.push(tmp);
					break;
			}
		}
	} else
		response = meta.uniqueItems ? [...new Set(value)] : value;

	if (meta.minItems && response.length < meta.minItems) {
		error.push(meta.$$ID + '.minitems');
		return;
	}

	if (meta.maxItems && response.length < meta.maxItems) {
		error.push(meta.$$ID + '.maxitems');
		return;
	}

	return response;
}

function check_object(meta, error, value, response, stop) {

	if (!value || typeof(value) !== 'object') {
		if (meta.$$REQUIRED)
			error.push(meta.$$ID + '.required');
		return;
	}

	if (stop && error.items.length)
		return;

	if (!response)
		response = new framework_builders.SchemaValue();

	var count = 0;
	var tmp;

	for (var key in meta.properties) {

		var prop = meta.properties[key];

		if (!prop.ID) {
			prop.$$ID = key;
			prop.$$REQUIRED = meta.required ? meta.required.indexOf(key) !== -1 : false;
		}

		if (stop && error.items.length)
			return;

		if (meta.maxProperties && count > meta.maxProperties) {
			error.push(meta.$$ID + '.maxproperties');
			return;
		}

		var val = value[key];

		switch (prop.type) {
			case 'number':
			case 'integer':
				tmp = check_number(prop, error, val);
				if (tmp != null) {
					response[key] = tmp;
					count++;
				}
				break;
			case 'boolean':
			case 'bool':
				tmp = check_boolean(prop, error, val);
				if (tmp != null) {
					response[key] = tmp;
					count++;
				}
				break;
			case 'date':
				tmp = check_date(prop, error, val);
				if (tmp != null) {
					response[key] = tmp;
					count++;
				}
				break;
			case 'string':
				tmp = check_string(prop, error, val);
				if (tmp != null) {
					response[key] = tmp;
					count++;
				}
				break;
			case 'object':
				if (prop.properties) {
					tmp = check_object(prop, error, val);
					if (tmp != null) {
						response[key] = tmp;
						count++;
					}
				} else {
					response[key] = val;
					count++;
				}
				break;
			case 'array':
				tmp = check_array(prop, error, val);
				if (tmp != null) {
					response[key] = tmp;
					count++;
				}
				break;
			default:
				if (prop.$ref) {
					var ref = F.jsonschemas[prop.$ref];
					if (ref) {
						tmp = check_object(ref, error, val);
						if (tmp != null) {
							response[key] = tmp;
							count++;
						} else if (prop.$$REQUIRED)
							error.push(prop.ID + '.required');
					} else
						error.push(prop.ID + '.reference');
				}
				break;
		}
	}

	if (meta.minProperties && count < meta.minProperties) {
		error.push(meta.$$ID + '.minproperties');
		return;
	}

	if (count)
		return response;
}

function check(meta, error, value, stop) {
	var output;
	switch (meta.type) {
		case 'string':
			output = check_string(meta, error, value);
			break;
		case 'number':
		case 'integer':
		case 'float':
		case 'decimal':
			output = check_number(meta, error, value);
			break;
		case 'boolean':
		case 'bool':
			output = check_boolean(meta, error, value);
			break;
		case 'date':
			output = check_date(meta, error, value);
			break;
		case 'object':
			output = check_object(meta, error, value, null, stop);
			break;
		case 'array':
			output = check_array(meta, error, value, stop);
			break;
		default:
			error.push('.type');
			return;
	}

	if (stop && error.length)
		return;

	return output;
}

function register(schema) {
	if (schema.$id)
		F.jsonschemas[schema.$id] = schema;
}

exports.register = register;
exports.transform = check;