// Tests for the JSON schema fixes: $MAKE() with a bound JSON schema, $ref to #/definitions, tuple items, maxItems and maxProperties
require('../index');

const Assert = require('assert');

function run(schema, value) {
	var error = new ErrorBuilder();
	var response = framework_jsonschema.transform(schema, error, value);
	return { response: JSON.parse(JSON.stringify(response)), errors: error.items.map(err => err.name + (err.path ? (':' + err.path) : '') + (err.index != null ? ('[' + err.index + ']') : '')) };
}

function definitions(properties) {
	return { type: 'object', properties: properties, definitions: { address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } } };
}

NEWSCHEMA('JSONSchemaFixes', function(schema) {
	schema.jsonschema({ $id: 'jsonschemafixes', type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } }, required: ['name'] });
});

setTimeout(function() {

	try {

		var res, err, model;

		// $MAKE() with a schema bound to a JSON schema
		model = $MAKE('JSONSchemaFixes', { name: 'Peter', age: 30, hack: true });
		Assert.deepStrictEqual(JSON.parse(JSON.stringify(model)), { name: 'Peter', age: 30 }, '$MAKE() returns the model');

		$MAKE('JSONSchemaFixes', { name: 'Lucy' }, function(e, response) {
			err = e;
			res = response;
		});
		Assert.strictEqual(err, null, '$MAKE() callback without error');
		Assert.strictEqual(res.name, 'Lucy', '$MAKE() callback gets the model');

		$MAKE('JSONSchemaFixes', { age: 1 }, function(e) {
			err = e;
		});
		Assert.strictEqual(err.items[0].name, 'name', '$MAKE() reports the required field');

		// $ref to #/definitions in a property (with and without "type")
		res = run(definitions({ addr: { $ref: '#/definitions/address' } }), { addr: { city: 'Bratislava' } });
		Assert.deepStrictEqual(res, { response: { addr: { city: 'Bratislava' } }, errors: [] }, '$ref without type');

		res = run(definitions({ addr: { $ref: '#/definitions/address' } }), { addr: { zip: 1 } });
		Assert.deepStrictEqual(res.errors, ['address.city:addr'], '$ref without type error');

		res = run(definitions({ addr: { type: 'object', $ref: '#/definitions/address' } }), { addr: { zip: 1 } });
		Assert.deepStrictEqual(res.errors, ['address.city:addr'], '$ref with type error');

		// $ref to #/definitions in array items
		res = run(definitions({ list: { type: 'array', items: { $ref: '#/definitions/address' } } }), { list: [{ city: 'A' }, { zip: 2 }] });
		Assert.deepStrictEqual(res.errors, ['address.city:list[1]'], '$ref in items error');

		// tuple items
		var tuple = { type: 'object', properties: { pair: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } } };
		res = run(tuple, { pair: ['a', '5'] });
		Assert.deepStrictEqual(res, { response: { pair: ['a', 5] }, errors: [] }, 'tuple valid');

		res = run(tuple, { pair: ['a', 'x'] });
		Assert.deepStrictEqual(res.errors, ['pair:pair'], 'tuple invalid item');

		res = run(tuple, { pair: ['a', 5, 6] });
		Assert.deepStrictEqual(res.errors, ['pair:pair'], 'tuple additional item');

		tuple.properties.pair.additionalItems = true;
		res = run(tuple, { pair: ['a', 5, 6] });
		Assert.deepStrictEqual(res.response, { pair: ['a', 5, 6] }, 'tuple with additionalItems');

		// maxItems
		var max = { type: 'object', properties: { list: { type: 'array', maxItems: 2, items: { type: 'number' } } } };
		Assert.deepStrictEqual(run(max, { list: [1] }).errors, [], 'maxItems under the limit');
		Assert.deepStrictEqual(run(max, { list: [1, 2] }).errors, [], 'maxItems at the limit');
		Assert.deepStrictEqual(run(max, { list: [1, 2, 3] }).errors, ['list:list'], 'maxItems over the limit');

		// maxProperties
		var props = { type: 'object', properties: { obj: { type: 'object', maxProperties: 2, properties: { a: { type: 'number' }, b: { type: 'number' }, c: { type: 'number' } } } } };
		Assert.deepStrictEqual(run(props, { obj: { a: 1, b: 2 } }).errors, [], 'maxProperties at the limit');
		Assert.deepStrictEqual(run(props, { obj: { a: 1, b: 2, c: 3 } }).errors, ['obj:obj'], 'maxProperties over the limit');

	} catch (e) {
		console.error(e);
		process.exit(1);
	}

	console.log('jsonschema-fixes: OK');
	process.exit(0);

}, 100);
