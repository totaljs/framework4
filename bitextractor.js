// Bit Extractor
// The MIT License
// Copyright 2021 (c) Peter Štolc <stolcp@posteo.de>

class BitExtractor {

	constructor(data, from, to) {

		var bin = this.toRadix(data, from).toString(2);

		this.offset = 0;
		this.data = data;
		this.to = to;

		this._bytes = bin.padStart(Math.ceil(bin.length / 8) * 8, '0');
		this._bits = '';

		var length = Math.ceil(bin.length / 8);
		for (var x = 0; x < length; x++)
			this._bits += this._bytes.substring(x * 8, (x * 8) + 8).split('').reverse().join('');

	};

	toRadix(value, radix) {
		var size = 10;
		var factor = BigInt(radix ** size);
		var i = value.length % size || size;
		var parts = [value.slice(0, i)];
		while (i < value.length)
			parts.push(value.slice(i, i += size));
		return parts.reduce((r, v) => r * factor + BigInt(parseInt(v, radix)), 0n);
	};

	parseBits(start, length = 1) {
		var bits = this._bits.substring(start, start + length).split('').reverse().join('');
		return this.to != 10 ? parseInt(bits, 2).toString(this.to) : parseInt(bits, 2);
	};

	parseBytes(start, length = 1) {
		start *= 8;
		length *= 8;
		if (start >= this._bytes.length)
			return 0;
		return this.to != 10 ? parseInt(this._bytes.substring(start, start + length), 2).toString(this.to) : parseInt(this._bytes.substring(start, start + length), 2);
	};

	shiftBits(bits = 1) {
		if (this.offset >= this._bits.length)
			return this.to != 10 ? '0' : 0;
		var ret = this.parseBits(this.offset, bits);
		this.offset += bits;
		return ret;
	};

	shiftByte(bytes = 1) {
		return this.bitShift(bytes * 8);
	};
}

exports.make = function(data, from = 16, to = 10) {
	return new BitExtractor(data, from, to);
};