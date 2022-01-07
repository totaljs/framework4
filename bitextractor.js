// Bit Extractor
// The MIT License
// Copyright 2021-2022 (c) Peter Štolc <stolcp@posteo.de>

var ALLOWED = {};

(function() {
	const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
	for (var i = 0; i < alphabet.length; i++)
		ALLOWED[alphabet[i]] = i + 1;
})();

class BitExtractor {

	#one = BigInt(1);
	#two = BigInt(2);
	#data = BigInt(0);
	#offsetRead = 0;
	#offsetWrite = 0;
	#length = 0;

	invalid = false;

	constructor(data = '', radix = 10) {

		/*
		if (!this._verifyRadix(radix)) {
			this.invalid = true;
			return;
		}*/

		data = this._verify(data, radix);

		if (data) {
			this.#data = this._toBigInt(data, radix);
			this.#length = this.#data.toString(2).length;
		} else
			this.invalid = true;

	};


	_verify(data, base) {
		data = data.toString().toLowerCase();
		for (let c of data) {
			if (ALLOWED[c] == null || ALLOWED[c] > base)
				return null;
		}
		return data;
	};

	_verifyRadix(radix) {
		return radix >= 2 && radix <= 36;
	}

	_toBigInt(value, radix) {

		var val = BigInt(0);

		if (value.length)
			if (radix === 16) {
				if (value.substring(0, 2) !== '0x')
					value = '0x' + value;
					val = BigInt(value);
			} else if (radix == 8) {
				if (value.substring(0, 2) !== '0o')
					value = '0o' + value;
				val = BigInt(value);
			} else {
				var chunk = 10;
				var factor = BigInt(radix ** chunk);
				var i = value.length % chunk || chunk;
				let parts = [value.slice(0, i)];
				while (i < value.length)
					parts.push(value.slice(i, i += chunk));
				val = parts.reduce((r, v) => r * factor + BigInt(parseInt(v, radix)), 0n);
			}

		return val;
	};

	/**
	 * Return a number binary consisting of 'length' of ones
	 */
	_ones(length) {
		return length ? (this.#two ** BigInt(length) - this.#one) : BigInt(0);
	};

	/**
	 * Create a mask of length 'total_length' consisting of ones
	 * and with an array of 0s at the position of 'position' and 'length' length
	 * calling this._mask(5, 3, 20) would return '11111111111100000111'
	 */
	_mask(length, position, total_length) {
		return (this.#two ** BigInt(total_length) - this.#one) & (~(this._ones(length) << BigInt(position)));
	};

	get offsetRead() {
		return this.#offsetRead;
	};

	set offsetRead(value) {
		if (Number.isInteger(value) && value >= 0 && value < this.#length)
			this.#offsetRead = value;
	};

	get offsetWrite() {
		return this.#offsetWrite;
	};

	set offsetWrite(value) {
		if (Number.isInteger(value) && value >= 0 && value < this.#length)
			this.#offsetWrite = value;
	};

	get buffer() {
		return Buffer.from(this.#data.toString(16), 'hex');
	};

	toString(radix = 10) {
		return this._verifyRadix(radix) ? this.#data.toString(radix) : '';
	};

	valueOf() {
		return this.#data;
	};

	parse(start, length = 1, type = 'bits', radix = 10) {
		return type === 'bits' ? this.parseBits(start, length, radix) : this.parseBytes(start, length, radix);
	};

	shift(length = 1, type = 'bits', radix = 10) {
		return type === 'bits' ? this.shiftBits(length, radix) : this.shiftBytes(length, radix);
	};

	/**
	 * Read "length" bits from the position 'start' from the data and represent it in radix base
	 */
	parseBits(start, length = 1, radix = 10) {
		if (this.invalid || !length || start == null || radix < 2 || radix > 36)
			return 0;
		var ret = ((this.#data >> BigInt(start))&this._ones(length));
		return radix == 10 ? ret < Number.MAX_SAFE_INTEGER ? Number(ret) : ret : ret.toString(radix);
	};

	parseBytes(start, length = 1, radix = 10) {
		return this.invalid ? 0 : this.parseBits(start * 8, length * 8, radix);
	};

	shiftBits(bits = 1, radix = 10) {

		if (this.invalid || this.#offsetRead >= this.#length)
			return 0;

		var ret = this.parseBits(this.#offsetRead, bits, radix);
		this.#offsetRead += bits;

		return ret;
	};

	shiftBytes(bytes = 1, radix = 10) {

		if (this.invalid || this.#offsetRead >= this.#length)
			return 0;

		var ret = this.parseBits(this.#offsetRead, bytes * 8, radix);
		this.#offsetRead += bytes * 8;

		return ret;
	};

	/**
	 * Write 'bits' of length 'length' at the position of 'position' to this.#data
	 */
	write(bits, length, position, radix = 10) {

		if (this.invalid)
			return 0;

		bits = this._verify(bits, radix)
		if (length && bits != null && Number.isInteger(position)) {
			bits = this._toBigInt(bits, radix);
			this.#data = (this.#data & this._mask(length, position, Math.max(this.#data.toString(2).length, position + length))) | (BigInt(bits) << BigInt(position));
			this.#length = this.#data.toString(2).length;
		}

		return this.#data;
	};

	/**
	 * Write sequentially to the #data according to the #offsetWrite pointer
	*/
	shiftWrite(bits, length, radix = 10) {
		if (this.invalid)
			return 0;
		var ret = this.write(bits, length, this.#offsetWrite, radix);
		this.#offsetWrite += length;
		return ret;
	};

}

exports.make = function(data, from = 16, to = 10) {
	return new BitExtractor(data, from, to);
};