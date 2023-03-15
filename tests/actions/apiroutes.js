NEWACTION('success', {
	input: 'valid:String',
	action: function($, model) {
		$.success(model);
	}
});

NEWACTION('keys', {
	input: 'valid:String',
	action: function($) {
		$.success($.keys);
	}
});

NEWACTION('one', {
	action: function($) {
		$.success();
	}
});

NEWACTION('two', {
	action: function($) {
		$.success();
	}
});