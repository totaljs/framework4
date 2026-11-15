// HttpFile.image() converter and the @{breadcrumb} view commands
//   cd tests && node internal-fixes.js

require('../index');

const Assert = require('assert');
const Internal = require('../internal');

var failed = 0;

function check(name, fn) {
	try {
		fn();
		console.log('OK  ', name);
	} catch (e) {
		failed++;
		console.log('FAIL', name, e.message);
	}
}

function file() {
	var obj = Object.create(Internal.HttpFile.prototype);
	obj.path = '/tmp/image.jpg';
	obj.width = 10;
	obj.height = 10;
	return obj;
}

check('HttpFile.image(true) uses ImageMagick', function() {
	Assert.strictEqual(file().image(true).cmdarg, 'im');
});

check('HttpFile.image(false) uses GraphicsMagick', function() {
	Assert.strictEqual(file().image(false).cmdarg, 'gm');
});

check('HttpFile.image() uses the default converter', function() {
	Assert.strictEqual(file().image().cmdarg, CONF.default_image_converter);
});

function compiled(source) {
	return String(Internal.viewEngineCompile(source, '', EMPTYCONTROLLER));
}

check('@{breadcrumb_url(...)} compiles to sitemap_url', function() {
	var code = compiled('<div>@{breadcrumb_url(\'home\')}</div>');
	Assert.ok(code.indexOf('sitemap__url') === -1, 'sitemap__url');
	Assert.ok(code.indexOf('sitemap_url') !== -1, 'no sitemap_url');
});

check('@{breadcrumb} reads the sitemap', function() {
	var code = compiled('<div>@{breadcrumb}</div>');
	Assert.ok(code.indexOf('$breadcrumb') === -1, 'still $breadcrumb');
	Assert.ok(code.indexOf("repository['$sitemap']") !== -1, 'no $sitemap');
});

setTimeout(function() {
	console.log(failed ? (failed + ' failed') : 'All tests passed');
	process.exit(failed ? 1 : 0);
}, 100);
