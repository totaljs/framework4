// Proof of Concept

require('./index');

F.transitions = {};

function Transition() {
	var t = this;
	t.actions = {};
}

function TransitionOptions() {}

var TP = Transition.prototype;
var TOP = TransitionOptions.prototype;

TP.refresh = function() {

	var t = this;

	for (var key in t.actions) {
		var item = t.actions[key];
		item.jsonschemainput = item.input ? item.input.toJSONSchema(key + '_input') : null;
		item.jsonschemaoutput = item.output ? item.output.toJSONSchema(key + '_output') : null;
		item.validate = function(type, value) {
			var error = new ErrorBuilder();
			var response = framework_jsonschema.transform(type === 'input' ? this.jsonschemainput : this.jsonschemaoutput, error, value);
			return { error: error.is ? error : null, response: response };
		};
	}

	return t;
};

TOP.callback = function(value) {

	var t = this;

	if (t.$callback) {
		var data = t.action.validate('output', value);
		t.$callback(null, data.response);
		t.$callback = null;
	}

	return t;
};

TOP.invalid = function(err) {
	var t = this;
	if (t.$callback) {
		t.error.push(err);
		t.$callback(t.error);
		t.$callback = null;
	}
	return t;
};

TOP.configure = function(config) {
	this.config = config;
	return this;
};

TOP.promise = function($) {
	var t = this;
	return new Promise(function(resolve, reject) {
		t.$callback = function(err, response) {
			if (err) {
				if ($ && $.invalid)
					$.invalid(err);
				else
					reject(err);
			} else
				resolve(response);
		};
	});
};

function exectransition(obj) {

	if (obj.action.jsonschemainput) {
		var res = obj.action.validate('input', obj.data || EMPTYOBJECT);
		if (res.error) {
			obj.$callback && obj.$callback(res.error);
			return;
		}
	}

	obj.action.exec.call(obj.action, obj);
}

global.TRANSITION = function(name, data, callback, controller) {

	var arr = name.split(/-->/).trim();

	var item = F.transitions[arr[0]];
	if (!item) {
		callback('The transition "{0}" not found'.format(arr[0]));
		return;
	}

	if (!item.ready) {
		callback('The transition "{0}" is not ready to use'.format(arr[0]));
		return;
	}

	var action = item.actions[arr[1]];
	if (!action) {
		callback('The input "{0}" not found in the "{1}" transition'.format(arr[1], arr[0]));
		return;
	}

	var obj = new TransitionOptions();
	obj.transition = item;
	obj.controller = controller ? (controller.controller || controller) : null;
	obj.action = action;
	obj.config = item.config;
	obj.$callback = callback;
	obj.data = obj.model = data;
	setImmediate(exectransition, obj);
	return obj;
};

global.NEWTRANSITION = function(name, fn) {

	var prev = F.transitions[name];

	if (prev) {
		prev.uninstall && prev.uninstall();
		prev = null;
	}

	if (!fn)
		return;

	var init = function() {

		var meta = new Transition();

		fn(meta);

		if (meta.npm) {
			NPMINSTALL(meta.npm, function() {
				meta.refresh();
				meta.install && meta.install();
				meta.ready = true;
			});
		} else {
			meta.refresh();
			meta.ready = true;
		}

		F.transitions[name] = meta;
	};

	if (prev)
		setTimeout(init, 1000);
	else
		init();
};

NEWTRANSITION('sms', function(exports) {

	// exports.name = '';
	// exports.config = {}
	// exports.readme = '';
	// exports.npm = [];

	exports.actions.send = {
		name: 'Send SMS',
		icon: 'fa fa-phone',
		input: '*phone:String, *message:String',
		output: 'success:Boolean',
		exec: function($) {

			$.callback({ success: true });
			// $.caller = TRANSITION;
			// $.config
			// $.action
			// $.data or $.model
			// $.user
			// $.controller
			// $.invalid(err);
			// $.output('name', data);
		}
	};

	/*
	exports.install = function() {
	};

	exports.uninstall = function() {
	};
	*/

});

(async function() {
	var a = await TRANSITION('sms --> send', { phone: '+421903163302', message: 'Test message' }).promise();
	console.log(a);
})();