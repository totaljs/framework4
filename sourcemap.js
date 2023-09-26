var timeout = null;

function parsefields(schema) {
	var input = [];
	for (let key in schema.schema) {
		let field = schema.schema[key];
		let type = 'string';
		let name = (field.required ? '*' : '') + key;
		switch (field.type) {
			case 1:
			case 2:
			case 11:
				type = field.isArray ? '[number]' : 'number';
				input.push(name + ':' + type);
				break;
			case 3:
				type = field.isArray ? '[string]' : 'string';
				input.push(name + ':' + type);
				break;
			case 4:
				type = field.isArray ? '[boolean]' : 'boolean';
				input.push(name + ':' + type);
				break;
			case 5:
				type = field.isArray ? '[date]' : 'date';
				input.push(name + ':' + type);
				break;

			case 6:
				type = field.isArray ? '[object]' : 'object';
				input.push(name + ':' + type);
				break;

			case 7:
				type = field.isArray ? ('[' + field.raw + ']') : field.raw;
				input.push(name + ':' + type);
				break;

			case 8:
				input.push(name + ':{' + field.raw.join('|') + '}');
				break;
		}
	}
	return input.join(',');
}

F.sourcemap = function() {

	var actions = [];
	var routes = [];
	var items = [];

	EACHSCHEMA(function(name, schema) {

		for (let key in schema.actions) {
			let action = schema.actions[key];
			let permissions = action.permissions instanceof Array ? action.permissions.join(',') : action.permissions;
			let input = action.input || parsefields(schema);
			items.push({ action: key, schema: name, name: action.name, summary: action.summary, params: action.params, input: input, output: action.output, query: action.query, permissions: permissions, owner: schema.$owner });
			actions.push({ name: name + ' --> ' + key, params: action.params, input: input, output: action.output, query: action.query, user: action.user, permissions: permissions, public: action.public, publish: action.publish, owner: schema.$owner });
		}

	});

	for (let key in F.actions) {
		let action = F.actions[key];
		let permissions = action.permissions instanceof Array ? action.permissions.join(',') : action.permissions;
		items.push({ action: key, name: action.name, summary: action.summary, params: action.params, input: action.input, output: action.output, query: action.query, permissions: permissions, owner: action.$owner });
		actions.push({ name: '* --> ' + key, params: action.params, input: action.input, output: action.output, query: action.query, user: action.user, permissions: permissions, public: action.public, publish: action.publish, owner: action.$owner });
	}

	for (let a in F.routes.api) {
		let actions = F.routes.api[a];
		for (let b in actions) {

			let action = actions[b];
			let obj = {};

			obj.id = action.name;
			obj.method = 'API';
			obj.schema = action.schema;
			obj.url = action.url;
			obj.auth = action.member;
			obj.summary = action.summary;
			obj.error = 'Action not found';
			obj.owner = action.owner;

			if (action.timeout !== CONF.default_request_timeout)
				obj.timeout = action.timeout;

			for (let i = 0; i < items.length; i++) {
				let m = items[i];

				if (action.action.indexOf(' ' + m.action) !== -1 && action.action.indexOf(m.schema + ' ') !== -1) {

					if (m.params)
						obj.params = m.params;

					if (m.query)
						obj.query = m.query;

					obj.input = m.input;
					obj.output = m.output;
					obj.permissions = m.permissions;
					obj.error = undefined;
					break;
				}

			}

			routes.push(obj);
		}
	}

	for (let a of F.routes.web) {

		let m = {};
		m.method = a.method;
		m.url = a.isWILDCARD ? a.urlraw.replace(/\*\//, '*') : a.urlraw;
		m.auth = a.MEMBER;
		m.owner = a.owner;

		if (a.paramnames && a.paramnames.length) {
			m.params = [];
			for (let p of a.paramnames)
				m.params.push(p + ':' + (a.paramtypes[p] || 'String'));
			m.params = m.params.join(',');
		}

		if (a.schema) {

			m.schema = a.schema.slice(0).trim().join('/');

			var schema = GETSCHEMA(m.schema);
			if (schema) {

				let id = a.workflow ? (a.workflow.id instanceof Array ? a.workflow.id[0] : a.workflow.id) : '';
				let action = id && schema.actions ? schema.actions[id] : null;

				if (action) {

					m.summary = action.summary;
					m.params = action.params;
					m.query = action.query;
					m.output = action.output;
					m.permissions = m.permissions instanceof Array ? m.permissions.join(',') : m.permissions;

					if (m.method !== 'GET')
						m.input = action.input;

				} else {
					// old declaration
					if (m.method !== 'GET')
						m.input = parsefields(schema);
				}

			} else
				m.error = 'Schema not found';
		}

		if (a.timeout !== CONF.default_request_timeout)
			m.timeout = a.timeout;

		if (a.isUPLOAD) {
			m.upload = true;
			m.limit = a.length / 1024;
		}

		routes.push(m);
	}

	for (let a of F.routes.websockets) {
		let m = {};
		m.method = 'SOCKET';
		m.url = a.isWILDCARD ? a.urlraw.replace(/\*\//, '*') : a.urlraw;
		m.auth = a.MEMBER;
		m.owner = a.owner;

		if (a.paramnames && a.paramnames.length) {
			m.params = [];
			for (let p of a.paramnames)
				m.params.push(p + ':' + (a.paramtypes[p] || 'String'));
			m.params = m.params.join(',');
		}

		routes.push(m);
	}

	var output = {};

	output.routes = routes;
	output.plugins = [];
	output.actions = actions;

	for (let key in F.plugins) {
		let plugin = F.plugins[key];
		let permissions = [];
		if (plugin.permissions instanceof Array) {
			for (let permission of plugin.permissions)
				permissions.push(permission.id || permission);
		}
		output.plugins.push({ id: key, name: plugin.name, permissions: permissions.join(',') });
	}

	return output;
};

F.makesourcemap = function(force) {

	if (!force && (CONF.nosourcemap || F.id))
		return;

	timeout && clearTimeout(timeout);
	timeout = setTimeout(() => F.Fs.writeFile(process.mainModule.filename + '.map', JSON.stringify(F.sourcemap(), (key, value) => value == '' || value == null ? undefined : value, '\t'), NOOP), 1000);
};
