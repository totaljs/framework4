require('../index');

U.set({}, '.__proto__.fet', 'KO');

var a = {};
console.log(a);

var b = new Object();
console.log(b, Function.fet);