'use strict';

require('./index');

var REPLACE = { '=': '', '-': '+', '_': '/', '/': '_', '+': '-' };

function replace(t) {
	return REPLACE[t] || t;
}

function tobase64(buf) {
	return buf.toString('base64').replace(/\/|\+/g, replace).replace(/=+$/g, '');
}

function frombase64(buf) {
	return buf.replace(/-|_/, replace);
}

function sign_HM256(data, secret) {
	return tobase64(F.Crypto.createHmac('sha256', secret, { encoding: 'utf8' }).update(Buffer.from(data, 'utf8')).digest());
}

function JWT_ENCRYPT(val, secret, type) {

	var base64 = Buffer.from(JSON.stringify(val).replace(/\n/g, '\r\n'), 'utf8').toString('base64').replace(/=+$/, '');
	var data = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + base64;
	// {"alg": "HS256","typ": "JWT"}
	switch (type) {
		case 'HM256':
		default:
			return data + '.' + tobase64(sign_HM256(data, secret));
	}

}


console.log(JWT_ENCRYPT({ name: 'Peter' }, Buffer.from('12345678', 'ascii')));