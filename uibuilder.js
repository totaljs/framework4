// UIBuilder compiler | https://uibuilder.totaljs.com
// The MIT License
// Copyright 2023 (c) Peter Širka <petersirka@gmail.com>

const REG_END = /;|\n/;
const REG_STRING = /'|"/g;

exports.compile = async function(opt, callback) {

	if (!callback)
		return new Promise((resolve, reject) => exports.compile(opt, (err, response) => err ? reject(err) : resolve(response)));

	if (typeof(opt.schema) === 'string')
		opt.schema = opt.schema.parseJSON();

	var schema = opt.schema;
	var instances = getInstances(schema);
	var used = {};
	var response = {};

	for (let instance of instances)
		used[instance.component] = 1;

	var components = await getComponents(schema, used, opt.download);

	for (let key in schema)
		response[key] = schema[key];

	response.components = components;
	response.inputs = schema.inputs;
	response.outputs = schema.outputs;
	response.children = schema.children;
	response.compiled = true;

	if (response.cssoutput)
		response.css = response.cssoutput;

	delete response.editor;
	delete response.cssoutput;
	delete response.csseditor;
	delete response.csspreview;

	callback(null, response);
};

function getInstances(schema) {
	var response = [];
	var browse = function(parent) {

		for (let arr of parent.children) {
			for (let child of arr) {
				let cloned = F.TUtils.clone(child);
				cloned.children = undefined;
				response.push(cloned);
				browse(child);
			}
		}
	};

	browse(schema);
	return response;
}

async function Download(url) {
	return new Promise(function(resolve) {
		let opt = {};
		opt.url = url;
		opt.method = 'GET';
		opt.keepalive = true;
		opt.insecure = true;
		opt.callback = function(err, response) {
			resolve(response.status === 200 ? (response.body.isJSON() ? response.body.parseJSON(true) : response.body) : '');
		};
		REQUEST(opt);
	});
}

async function getComponents(schema, used, download) {

	var components = {};
	var arr = [];

	for (let key in schema.components)
		arr.push({ id: key, value: schema.components[key] });

	for (let com of arr) {

		if (com.value.indexOf('.json') === -1 & !used[com.id])
			continue;

		let url = com.value;
		if (url[0] === '/')
			url = schema.origin + url;

		let body = await Download(url.format(com.id));

		if (typeof(body) === 'string') {

			let index = body.indexOf('exports.render');
			if (index === -1) {
				// without render
				continue;
			}

			index += 14;

			let end = body.substring(index).match(REG_END);
			if (!end) {
				// without end
				continue;
			}

			let render = body.substring(body.indexOf('=', index) + 1, index + end.index).trim().replace(REG_STRING, '').format(com.id);

			if (download) {

				if (render[0] === '/')
					render = schema.origin + render;

				let html = await Download(render);
				if (html)
					components[com.id] = 'base64 ' + Buffer.from(encodeURIComponent(html), 'utf8').toString('base64');
			} else
				components[com.id] = render;

		} else {
			for (let key in body)
				arr.push({ id: key, value: body[key] });
		}

	}

	return components;
}