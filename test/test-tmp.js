require('../index');

const Fs = require('fs');

// FILESTORAGE('kokotaris').save(UID(), 'backoffice.sql', Buffer.from('KwkJCQkvLyBpZiAodGV4dC5sZW5ndGggPCAxMDAwKQorCQkJCS8vIAlpdGVtcy5wdXNoKHsgbmFtZTogJ0AoQ29weSB0byBpbWFnZSknLCBpY29uOiAnY2FtZXJhJywgdmFsdWU6ICdjb3B5aW1hZ2UnIH0pOworCiAJCQkJaXRlbXMucHVzaCh7IG5hbWU6ICdAKENvcHkgYXMgTWFya2Rvd24pJywgaWNvbjogJyFmYWIgZmEtbWFya2Rvd24nLCB2YWx1ZTogJ2NvcHltYXJrZG93bicgfSk7CgogCQkJCWlmICh0ZXh0LmluZGV4T2YoJy5kZWZpbmUoXCcnKSAhPT0gLTEpCkBAIC04NzEsNiArODc1LDEyIEBACiAJCQkJCXJldHVybjsKIAkJCQl9CgorCQkJCWlmICh2YWx1ZS52YWx1ZSA9PT0gJ2NvcHlpbWFnZScpIHsKKwkJCQkJdmFyIGN1ciA9IGVkaXRvci5nZXRNb2RlQXQoZWRpdG9yLmdldEN1cnNvcigpKTsKKwkJCQkJY29uc29sZS5sb2coJ2h0dHBzOi8vY2FyYm9uLm5vdy5zaC9iZz1yZ2JhKDI0MyxDMjQzLEMyNDMsQzEpJnQ9c2V0aSZ3dD1ub25lJmw9ezB9JmRzPXRydWUmZHN5b2ZmPTIwcHgmZHNibHVyPTY4cHgmd2M9dHJ1ZSZ3YT10cnVlJnB2PTIxcHgmcGg9MjNweCZsbj1mYWxzZSZlcz0yeCZjb2RlPScuZm9ybWF0KChjdXIuaGVscGVyVHlwZSB8fCBjdXIubmFtZSkucmVwbGFjZSgvdG90YWxqc3xodG1sLywgJ2h0bWxtaXhlZCcpKSArIGVuY29kZVVSSUNvbXBvbmVudChGVU5DLnN0cmltKHRleHQpLnJlcGxhY2UoL1x0L2csICcgICAnKSkpOworCQkJCQlyZXR1cm47CisJCQkJfQ==', 'base64'), console.log);
// FILESTORAGE('kokotaris').save(UID(), 'avatar.jpg', Fs.createReadStream('/Users/petersirka/Dropbox/avatar.jpg'), console.log);

// FILESTORAGE('kokotaris').readmeta('175005001tu61b', console.log);
// FILESTORAGE('kokotaris').read('175005001tu61b', function(err, response) {
// 	console.log(response);
// });

const Zlib = require('zlib');
console.log(Buffer.from(new Uint8Array(Buffer.from('Peter', 'ascii'))));
// Fs.createReadStream(PATH.databases('test.nosql')).on('data', function(buffer) {
// 	console.log(buffer.toString('base64').length);
// });