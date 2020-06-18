// Copyright 2012-2020 (c) Peter Širka <petersirka@gmail.com>
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
 * @module FileStorage
 * @version 4.0.0
 */

const Readable = require('stream').Readable;
const Path = require('path');
const Fs = require('fs');
const IMAGES = { jpg: 1, png: 1, gif: 1, svg: 1, jpeg: 1, heic: 1, heif: 1, webp: 1, tiff: 1, bmp: 1 };
const HEADERSIZE = 2000;
const MKDIR = { recursive: true };
const REGCLEAN = /^[\s]+|[\s]+$/g;
const BINARYREADDATA = { start: HEADERSIZE };
const BINARYREADDATABASE64 = { start: HEADERSIZE, encoding: 'base64' };
const BINARYREADMETA = { start: 0, end: HEADERSIZE - 1, encoding: 'binary' };

function FileDB(name, directory) {
	var t = this;
	t.name = name;
	// t.directory = directory;
	// t.logger = directory + '/files.log';
	t.cache = {};
	t.total = 0;
	t.size = 0;
	t.ext = '.file';
	t.pause = false;

	ON('service', function(counter) {
		if (counter % 10)
			t.cache = {};
	});

	t.retrysave = function(id, name, filename, callback) {
		t.save(id, name, filename, callback);
	};

	t.retryread = function(id, callback, nostream) {
		t.read(id, callback, nostream);
	};

	t.storage(directory);
}

const FP = FileDB.prototype;

FP.storage = function(value) {
	var self = this;
	self.cache = {};
	self.directory = value;
	self.logger = value + '/files.log';
	return self;
};

FP.count = function(callback) {
	var self = this;
	NOSQL('~' + self.logger).scalar('sum', 'size').callback(function(err, response) {
		response.size = response.sum;
		self.size = response.size;
		self.total = response.count;
		response.sum = undefined;
		callback && callback(err, response);
	});
	return self;
};

FP.makedirectory = function(id) {

	var val = (HASH(id, true) % 10000) + '';
	var diff = 4 - val.length;

	if (diff > 0) {
		for (var i = 0; i < diff; i++)
			val = '0' + val;
	}

	if (diff.length > 4)
		val = val.substring(0, 4);

	return Path.join(this.directory, val);
};

FP.readfilename = function(id) {
	var self = this;
	var directory = self.makedirectory(id);
	return Path.join(directory, id + '.file');
};

FP.save = function(id, name, filename, callback) {

	var self = this;

	if (self.pause) {
		setTimeout(self.retrysave, 500, id, name, filename, callback);
		return self;
	}

	var directory = self.makedirectory(id);
	var filenameto = Path.join(directory, id + '.file');

	var index = name.lastIndexOf('/');
	if (index !== -1)
		name = name.substring(index + 1);

	if (self.cache[directory]) {
		self.saveforce(id, name, filename, filenameto, callback);
	} else {
		Fs.mkdir(directory, MKDIR, function(err) {
			if (err)
				callback(err);
			else {
				self.cache[directory] = 1;
				self.saveforce(id, name, filename, filenameto, callback);
			}
		});
	}

	return self;
};

FP.saveforce = function(id, name, filename, filenameto, callback, custom) {

	if (!callback)
		callback = NOOP;

	var isbuffer = filename instanceof Buffer;
	var self = this;
	var header = Buffer.alloc(HEADERSIZE, ' ');
	var reader = isbuffer ? null : filename instanceof Readable ? filename : Fs.createReadStream(filename);
	var writer = Fs.createWriteStream(filenameto);
	var ext = framework_utils.getExtension(name);
	var meta = { name: name, size: 0, ext: ext, custom: custom, type: U.getContentType(ext) };
	var tmp;

	writer.write(header, 'binary');

	if (IMAGES[meta.ext]) {
		if (isbuffer) {
			switch (meta.ext) {
				case 'gif':
					tmp = framework_image.measureGIF(filename);
					break;
				case 'png':
					tmp = framework_image.measurePNG(filename);
					break;
				case 'jpg':
				case 'jpeg':
					tmp = framework_image.measureJPG(filename);
					break;
				case 'svg':
					tmp = framework_image.measureSVG(filename);
					break;
			}
		} else {
			reader.once('data', function(buffer) {
				switch (meta.ext) {
					case 'gif':
						tmp = framework_image.measureGIF(buffer);
						break;
					case 'png':
						tmp = framework_image.measurePNG(buffer);
						break;
					case 'jpg':
					case 'jpeg':
						tmp = framework_image.measureJPG(buffer);
						break;
					case 'svg':
						tmp = framework_image.measureSVG(buffer);
						break;
				}
			});
		}
	}

	if (isbuffer)
		writer.end(filename);
	else
		reader.pipe(writer);

	CLEANUP(writer, function() {

		Fs.open(filenameto, 'r+', function(err, fd) {

			if (err) {
				// Unhandled error
				callback(err);
				return;
			}

			if (tmp) {
				meta.width = tmp.width;
				meta.height = tmp.height;
			}

			meta.size = writer.bytesWritten - HEADERSIZE;
			meta.date = NOW = new Date();

			self.total++;
			self.size += meta.size;

			if (meta.name.length > 250)
				meta.name = meta.name.substring(0, 250);

			header.write(JSON.stringify(meta));

			// Update header
			Fs.write(fd, header, 0, header.length, 0, function(err) {
				if (err) {
					callback(err);
					Fs.close(fd, NOOP);
				} else {
					meta.id = id;
					Fs.appendFile(self.logger, JSON.stringify(meta) + '\n', NOOP);
					Fs.close(fd, () => callback(null, meta));
				}
			});
		});
	});
};

FP.read = function(id, callback, nostream) {

	var self = this;

	if (self.pause) {
		setTimeout(self.retryread, 500, id, callback, nostream);
		return self;
	}

	var filename = Path.join(self.makedirectory(id), id + '.file');

	Fs.open(filename, 'r', function(err, fd) {

		if (err) {
			callback(err);
			return;
		}

		var buffer = Buffer.alloc(HEADERSIZE);
		Fs.read(fd, buffer, 0, HEADERSIZE, 0, function(err) {

			if (err) {
				callback(err);
				Fs.close(fd, NOOP);
				return;
			}

			var meta = buffer.toString('utf8').replace(REGCLEAN, '').parseJSON(true);
			meta.id = id;

			if (!nostream) {
				meta.stream = Fs.createReadStream(filename, { fd: fd, start: HEADERSIZE });
				CLEANUP(meta.stream, () => Fs.close(fd, NOOP));
			}

			callback(err, meta);
		});
	});

	return self;
};

FP.browse = function(callback) {
	var db = NOSQL('~' + this.logger).find();
	if (callback)
		db.$callback = callback;
	return db;
};

FP.remove = function(id, callback) {
	var self = this;
	var filename = Path.join(self.makedirectory(id), id + '.file');
	Fs.unlink(filename, function(err) {
		NOSQL('~' + self.logger).remove().where('id', id);
		callback && callback(err);
	});
	return self;
};

FP.clear = function(callback) {

	var self = this;
	var count = 0;

	self.pause = true;

	Fs.readdir(self.directory, function(err, response) {
		if (err)
			return callback(err);
		Fs.unlink(self.logger, NOOP);
		response.wait(function(item, next) {
			var dir = Path.join(self.directory, item);
			Fs.readdir(dir, function(err, response) {
				if (response instanceof Array) {
					count += response.length;
					response.wait((file, next) => Fs.unlink(Path.join(self.directory, item, file), next), () => Fs.rmdir(dir, next));
				} else
					next();
			});
		}, function() {
			Fs.unlink(self.logger, NOOP);
			self.pause = false;
			self.cache = {};
			callback && callback(null, count);
		});

	});

	return self;
};

FP.browse2 = function(callback) {
	var self = this;
	Fs.readdir(self.directory, function(err, response) {

		var files = [];

		if (err) {
			callback(null, files);
			return;
		}

		response.wait(function(item, next) {
			Fs.readdir(Path.join(self.directory, item), function(err, response) {
				if (response instanceof Array) {
					response.wait(function(item, next) {
						var id = item.substring(0, item.lastIndexOf('.'));
						self.read(id, function(err, meta) {
							if (meta) {
								meta.id = id;
								files.push(meta);
							}
							next();
						}, true);
					}, next);
				} else
					next();
			});
		}, () => callback(null, files));
	});
	return self;
};

FP.rebuild = function(callback) {

	var self = this;

	self.browse2(function(err, files) {

		self.pause = true;

		Fs.unlink(self.logger, NOOP);

		var builder = [];
		self.size = 0;
		self.total = 0;

		for (var i = 0; i < files.length; i++) {
			var item = files[i];
			self.size += item.size;
			self.total++;
			builder.push(JSON.stringify(item));
		}

		builder.limit(500, (items, next) => Fs.appendFile(self.logger, items.join('\n'), next), function() {
			Fs.appendFile(self.logger, '\n', NOOP);
			self.pause = false;
			callback && callback();
		});
	});

	return self;
};

FP.count2 = function(callback) {
	var self = this;
	var count = 0;
	Fs.readdir(self.directory, function(err, response) {
		response.wait(function(item, next) {
			Fs.readdir(Path.join(self.directory, item), function(err, response) {
				if (response instanceof Array)
					count += response.length;
				next();
			});
		}, () => callback(null, count));
	});
	return self;
};

function jsonparser(key, value) {
	return typeof(value) === 'string' && value.isJSONDate() ? new Date(value) : value;
}

FP.readmeta = function(id, callback, count) {

	var self = this;

	if (count > 3) {
		callback(new Error('File not found.'));
		return self;
	}

	var filename = Path.join(self.makedirectory(id), id + self.ext);

	var stream = Fs.createReadStream(filename, HEADERSIZE);
	stream.on('error', err => callback(err));
	stream.on('data', function(buffer) {
		var json = buffer.toString('utf8').replace(REGCLEAN, '');
		if (json) {
			callback(null, JSON.parse(json, jsonparser));
			CLEANUP(stream);
		} else
			setTimeout(readfileattempt, 100, self, id, callback, count || 1);
	});

	return self;
};

FP.res = function(res, options, checkcustom) {

	var self = this;
	var req = res.req;

	if (RELEASE && req.$key && F.temporary.notfound[req.$key] !== undefined) {
		res.throw404();
		return res;
	}

	var id = options.id || '';
	var filename = Path.join(self.makedirectory(id), id + self.ext);

	var stream = Fs.createReadStream(filename, BINARYREADMETA);

	stream.on('error', function() {
		if (RELEASE)
			F.temporary.notfound[F.createTemporaryKey(req)] = true;
		res.throw404();
	});

	stream.on('data', function(buffer) {
		var json = buffer.toString('utf8').replace(REGCLEAN, '');
		if (json) {

			var obj;

			try {
				obj = JSON.parse(json, jsonparser);
			} catch (e) {
				console.log('FileStorage Error:', filename, e);
				if (RELEASE)
					F.temporary.notfound[F.createTemporaryKey(req)] = true;
				res.throw404();
				return;
			}

			if (checkcustom && checkcustom(obj) == false) {
				if (RELEASE)
					F.temporary.notfound[F.createTemporaryKey(req)] = true;
				res.throw404();
				return;
			}

			var utc = obj.date ? obj.date.toUTCString() : '';

			if (!options.download && req.headers['if-modified-since'] === utc) {
				res.extention = framework_utils.getExtension(obj.name);
				F.$file_notmodified(res, utc);
			} else {

				if (RELEASE && req.$key && F.temporary.path[req.$key]) {
					res.$file();
					return res;
				}

				res.options.type = obj.type;
				res.options.stream = Fs.createReadStream(filename, BINARYREADDATA);
				res.options.lastmodified = true;

				!options.headers && (options.headers = {});

				if (options.download) {
					res.options.download = options.download === true ? obj.name : typeof(options.download) === 'function' ? options.download(obj.name, obj.type) : options.download;
				} else
					options.headers['Last-Modified'] = utc;

				if (obj.width && obj.height) {
					options.headers['X-Width'] = obj.width;
					options.headers['X-Height'] = obj.height;
				}

				options.headers['X-Size'] = obj.size;
				res.options.headers = options.headers;
				res.options.done = options.done;

				if (options.image) {
					res.options.make = options.make;
					res.options.cache = options.cache !== false;
					res.$image();
				} else {
					res.options.compress = options.nocompress ? false : true;
					res.$stream();
				}
			}
		} else {
			if (RELEASE)
				F.temporary.notfound[F.createTemporaryKey(req)] = true;
			res.throw404();
		}
	});
};

FP.readbase64 = function(id, callback, count) {

	var self = this;

	if (count > 3) {
		callback(new Error('File not found.'));
		return self;
	}

	var filename = Path.join(self.makedirectory(id), id + self.ext);
	var stream = Fs.createReadStream(filename, BINARYREADMETA);
	stream.on('error', err => callback(err));
	stream.on('data', function(buffer) {
		var json = buffer.toString('utf8').replace(REGCLEAN, '');
		if (json) {
			var meta = JSON.parse(json, jsonparser);
			meta.stream = Fs.createReadStream(filename, BINARYREADDATABASE64);
			callback(null, meta);
			CLEANUP(stream);
		} else
			setTimeout(readfileattempt, 100, self, id, callback, count || 1);
	});

	return self;
};

function readfileattempt(self, id, callback, count) {
	self.readmeta(id, callback, count + 1);
}

FP.drop = function(callback) {
	this.clear(callback);
};

exports.FileDB = function(name, directory) {
	return new FileDB(name, directory);
};
