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
 * @module Utils
 * @version 1.0.0
 */

// Dependencies
const COMPARER = global.Intl.Collator().compare;

exports.sort = function(builder, item) {
	var length = builder.response.length;
	if (length < builder.$take) {
		length = builder.response.push(item);
		var type = builder.$sorttype;
		if (!type) {
			if (item[builder.$sortname] instanceof Date) {
				type = builder.$sorttype = 4;
			} else {
				switch (typeof(item[builder.$sortname])) {
					case 'number':
						type = 2;
						break;
					case 'boolean':
						type = 3;
						break;
					case 'string':
						type = 1;
						break;
					default:
						return true;
				}
				builder.$sorttype = type;
			}
		}
		if (length >= builder.$take) {
			builder.response.sort((a, b) => sortcompare(type, builder, a, b));
			builder.$sorted = true;
		}
		return true;
	} else
		return chunkysort(builder, item);
};

exports.sortfinal = function(builder) {
	builder.response.sort((a, b) => sortcompare(builder.$sorttype, builder, a, b));
};

function sortcompare(type, builder, a, b) {
	var va = a[builder.$sortname];
	var vb = b[builder.$sortname];
	var vr = 0;

	switch (type) {
		case 1: // string
			vr = va && vb ? COMPARER(va, vb) : va && !vb ? -1 : 1;
			break;
		case 2: // number
			vr = va != null && vb != null ? (va < vb ? -1 : 1) : va != null && vb == null ? -1 : va === vb ? 0 : 1;
			break;
		case 3: // boolean
			vr = va === true && vb === false ? -1 : va === false && vb === true ? 1 : 0;
			break;
		case 4: // Date
			vr = va != null && vb != null ? (va < vb ? -1 : 1) : va != null && vb == null ? -1 : 1;
			break;
	}
	return builder.$sortasc ? vr : (vr * -1);
}

function chunkysort(builder, item) {

	var beg = 0;
	var length = builder.response.length;
	var tmp = length - 1;
	var type = builder.$sorttype;

	var sort = sortcompare(type, builder, item, builder.response[tmp]);
	if (sort !== -1)
		return;

	tmp = builder.response.length / 2 >> 0;
	sort = sortcompare(type, builder, item, builder.response[tmp]);

	if (sort !== -1)
		beg = tmp + 1;

	for (var i = beg; i < length; i++) {
		var old = builder.response[i];
		var sort = sortcompare(type, builder, item, old);
		if (sort === -1) {
			for (var j = length - 1; j > i; j--)
				builder.response[j] = builder.response[j - 1];
			builder.response[i] = item;
		}
		return true;
	}
}