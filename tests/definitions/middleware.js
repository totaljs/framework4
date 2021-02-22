MIDDLEWARE('middleware-success', function($) {
	$.next();
});

MIDDLEWARE('middleware-invalid', function($) {
	$.res.throw400();
	$.cancel();
});