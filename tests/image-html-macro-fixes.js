// Image.trim() command, Image.measure() on a stream, HTML find() on found elements,
// NEWMACRO() with names containing "if" / "else" and the debug watcher pattern for components.
//   cd tests && node image-html-macro-fixes.js

require('../index');

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Stream = require('stream');

try {
	// Image.trim() must not add a stray "1" to the command
	var img = Image.load('input.jpg', 'gm');
	img.islimit = true;
	img.trim();
	Assert.deepStrictEqual(img.arg(), ['convert', '-trim', '+repage'], 'trim() must not add a stray value');
} catch (e) {
	console.error(e);
	process.exit(1);
}

// HTML find() on found elements
try {
	var dom = '<div class="a"><span>1</span></div><div class="a"><span>2</span><span>3</span></div><p class="a"></p>'.parseHTML();
	var found = dom.find('.a');
	Assert.strictEqual(found.length, 3, 'find() on the document');
	var spans = found.find('span');
	Assert.notStrictEqual(spans, found, 'find() on found elements must return a new array');
	Assert.strictEqual(spans.length, 3, 'find() on found elements must return the found elements');
	Assert.strictEqual(spans[0].tagName, 'SPAN', 'find() on found elements must return elements');
	Assert.strictEqual(spans.map(n => n.text()).join(','), '1,2,3');
	Assert.strictEqual(typeof(spans.find), 'function', 'find() on found elements must return an extended array');
} catch (e) {
	console.error(e);
	process.exit(1);
}

// NEWMACRO() with names containing "if" / "else"
try {
	var helpers = { notify: () => 'notified' };
	var fn = NEWMACRO('IF modified > 5\nRETURN notify()\nELSE IF diff > 1\nRETURN elsewhere\nELSE\nRETURN "none"\nFI');
	Assert.strictEqual(fn({ modified: 10 }, helpers), 'notified', 'NEWMACRO() IF branch with "if" in the names');
	Assert.strictEqual(fn({ modified: 1, diff: 2, elsewhere: 'away' }, helpers), 'away', 'NEWMACRO() ELSE IF branch with "else" in the names');
	Assert.strictEqual(fn({ modified: 1, diff: 0 }, helpers), 'none', 'NEWMACRO() ELSE branch');
	Assert.strictEqual(NEWMACRO('RETURN elsevalue')({ elsevalue: 7 }, helpers), 7, 'NEWMACRO() with a name starting with "else"');
} catch (e) {
	console.error(e);
	process.exit(1);
}

// Debug watcher: the .html pattern for components/plugins/extensions
try {
	var source = Fs.readFileSync(Path.join(__dirname, '..', 'debug.js'), 'utf8');
	var match = source.match(/const REG_COMPONENTS = (\/.*\/i);/);
	Assert.ok(match, 'REG_COMPONENTS not found in debug.js');
	var reg = new Function('return ' + match[1])();
	Assert.ok(reg.test('/app/components/a.html'), 'watcher must match a single-character name');
	Assert.ok(reg.test('/app/components/textbox.html'), 'watcher must match components/textbox.html');
	Assert.ok(reg.test('/app/plugins/my-plugin.html'), 'watcher must match plugins/my-plugin.html');
	Assert.ok(reg.test('/app/extensions/ext_1.html'), 'watcher must match extensions/ext_1.html');
} catch (e) {
	console.error(e);
	process.exit(1);
}

// Image.measure() on a stream must return its error to the callback
var timeout = setTimeout(function() {
	console.error('measure() did not call the callback');
	process.exit(1);
}, 2000);

try {
	Image.load(new Stream.PassThrough()).measure(function(err) {
		clearTimeout(timeout);
		try {
			Assert.ok(err instanceof Error, 'measure() on a stream must return an error');
			Assert.strictEqual(err.message, 'Measure does not support stream.');
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
		console.log('OK');
		process.exit(0);
	});
} catch (e) {
	console.error(e);
	process.exit(1);
}
