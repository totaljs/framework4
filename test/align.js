require('../index');

/*
CONF.table_test = 'id:uid,dtcreated:date';
TABLE('test').count().callback(console.log);
*/

// Users In Agencies
NEWSCHEMA('Agencies/Users', function(schema) {

	schema.encrypt();
	schema.compress();

	schema.define('sa', Boolean);
	schema.define('role', []);
	schema.define('position', 'String(50)');
	schema.define('firstname', 'Name(40)');
	schema.define('lastname', 'Name(40)');
	schema.define('email', 'Email');
	schema.define('phone', 'Phone');
	schema.define('password', 'String(50)');
	schema.define('gender', []);
	schema.define('dtbirth', 'Date');
	schema.define('isdisabled', Boolean);
	schema.define('photo', 'String(80)');

	schema.addWorkflow('check', function($, model) {
		$.success();
	});

	schema.setInsert(function($, model) {

		console.log('KOKOT');

		if ($.user.sa) {

			var db = DBMS();

			model.id = UID();
			model.login = model.email;
			model.token = GUID(50);
			model.dtcreated = NOW;
			model.agencyid = $.user.agencyid;
			model.name = (model.firstname + ' ' + model.lastname).max(50);
			model.password = model.password.sha256(CONF.salt_password);

			console.log('Send token -->', model.token);

			db.insert('tbl_user', model);
			db.log($, model);
			db.callback($.done(model.id));

		} else
			$.invalid('401');
	});

});

$ACTION('POST *Agencies/Users   --> check insert', {}, console.log);
