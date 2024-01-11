// UIBuilder compiler | https://uibuilder.totaljs.com
// The MIT License
// Copyright 2023 (c) Peter Širka <petersirka@gmail.com>

const REG_END = /;|\n/;
const REG_STRING = /'|"/g;

exports.compile = async function(opt, callback) {

	// opt.schema {String/Object}
	// |--- opt.schema.origin {String}
	// opt.local {Boolean}
	// opt.download {Boolean}
	// opt.origin {String}

	if (!callback)
		return new Promise((resolve, reject) => exports.compile(opt, (err, response) => err ? reject(err) : resolve(response)));

	if (typeof(opt.schema) === 'string')
		opt.schema = opt.schema.parseJSON();

	var schema = opt.schema;
	var instances = getInstances(schema);
	var used = {};
	var response = {};

	for (let instance of instances)
		used[instance.component] = '#';

	if (opt.local) {
		response.components = used;
	} else {
		let components = await getComponents(opt, used);
		response.components = components;
	}

	for (let key in schema) {
		if (key !== 'components')
			response[key] = schema[key];
	}

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

exports.download = async function(opt, callback) {

	if (!callback)
		return new Promise((resolve, reject) => exports.download(opt, (err, response) => err ? reject(err) : resolve(response)));

	try {
		let response = await getComponents2(opt);
		callback(null, response);
	} catch (e) {
		callback(e);
	}

};

function getInstances(schema) {
	var response = [];
	var browse = function(parent) {

		for (let arr of parent.children) {
			for (let child of arr) {
				let cloned = CLONE(child);
				cloned.children = undefined;
				response.push(cloned);
				browse(child);
			}
		}
	};

	browse(schema);
	return response;
}

async function Download(url, local = false) {
	return new Promise(function(resolve) {

		if (local && url[0] === '~') {
			// File on HDD (potential dangerous)
			F.Fs.readFile(url.substring(1), 'utf8', function(err, response) {
				resolve(err ? '' : (response.isJSON() ? response.parseJSON(true) : response));
			});
		} else {
			let opt = {};
			opt.url = url;
			opt.method = 'GET';
			opt.keepalive = true;
			opt.insecure = true;
			opt.callback = function(err, response) {
				resolve(response.status === 200 ? (response.body.isJSON() ? response.body.parseJSON(true) : response.body) : '');
			};
			REQUEST(opt);
		}
	});
}

function parseorigin(url) {

	var origin = '';

	if (url.charAt(0) !== '/') {
		var index = url.indexOf('/', 9);
		origin = index === -1 ? url : url.substring(0, index);
	}

	return origin;
}

async function getComponents(opt, used) {

	var schema = opt.schema;
	var download = opt.download;
	var components = {};
	var arr = [];

	for (let key in schema.components)
		arr.push({ id: key, value: schema.components[key] });

	for (let com of arr) {

		if (com.value.indexOf('.json') === -1 && !used[com.id])
			continue;

		let url = com.value;
		let origin = opt.origin || schema.origin;

		if (url[0] === '/') {
			url = origin + url;
		} else
			origin = parseorigin(url);

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

			if (render[0] === '/')
				render = (origin || schema.origin || '') + render;

			if (download) {
				if (render.substring(0, 7) === 'base64 ') {
					components[com.id] = render;
				} else {
					let html = await Download(render);
					if (html)
						components[com.id] = 'base64 ' + Buffer.from(encodeURIComponent(html), 'utf8').toString('base64');
				}
			} else
				components[com.id] = render;
		} else {
			for (let key in body)
				arr.push({ id: key, value: body[key] });
		}
	}

	return components;
}

async function getComponents2(opt) {

	var list = opt.components;
	var origin = opt.origin;
	var components = {};
	var arr = [];

	for (let key in list)
		arr.push({ id: key, value: list[key] });

	for (let com of arr) {

		let url = com.value;
		if (url[0] === '/')
			url = origin + url;

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

			if (render.substring(0, 7) === 'base64 ') {
				components[com.id] = render;
			} else {
				if (render[0] === '/')
					render = origin + render;
				let html = await Download(render);
				if (html)
					components[com.id] = 'base64 ' + Buffer.from(encodeURIComponent(html), 'utf8').toString('base64');
			}
		} else {
			for (let key in body)
				arr.push({ id: key, value: body[key] });
		}
	}

	return components;
}