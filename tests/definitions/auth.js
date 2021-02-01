AUTH(function($) {

	var user = {};
	user.name = 'Fetak Dusan';

	if ($.cookie('auth') === 'correct-cookie')
		$.success(user);
	else
		$.invalid();

});