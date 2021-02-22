MIDDLEWARE('middleware-success', function($) {
	$.next();
});

MIDDLEWARE('middleware-invalid', function($) {
	$.res.throw400();
	$.cancel();
});

MIDDLEWARE('middleware-socket', function($) {
	EMIT('socket_middleware_close');
	$.next();
});

MIDDLEWARE('middleware-fuse', function($) {
	EMIT('fuse');
	$.next();
});