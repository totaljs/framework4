MIDDLEWARE('middleware-success', function($) {
	$.next();
});

MIDDLEWARE('middleware-invalid', function($) {
	$.res.throw400();
	$.cancel();
});

MIDDLEWARE('middleware-socket', function($) {
	console.log("EMITING");
	EMIT('socket_middleware_close');
	$.next();
});