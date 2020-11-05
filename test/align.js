require('../index');

function analyze(body) {

	body = body.trim();

	var matches;
	var queries = [];
	var params = [];
	var filters = [];
	var isid = body.indexOf('$.id') !== -1;
	var autofill;
	var autoquery;
	var tmp;
	var arr;

	matches = body.match(/query\.[a-z0-9_]+/gi);

	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			tmp = matches[i].trim();
			if (queries.indexOf(tmp) == -1)
				queries.push(tmp);
		}
	}

	matches = body.match(/filter\.[a-z0-9_]+/gi);
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			tmp = matches[i].trim();
			if (filters.indexOf(tmp) == -1)
				filters.push(tmp);
		}
	}

	matches = body.match(/params\.[a-z0-9_]+/gi);
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			tmp = matches[i].trim();
			if (params.indexOf(tmp) == -1)
				params.push(tmp);
		}
	}

	var index = body.indexOf('.autofill(');
	if (index !== -1) {
		tmp = body.substring(index + 9, body.indexOf(')', index)).split(/'|"/);

		autofill = {};

		if (tmp[1]) {
			arr = tmp[1].split(',').trim();
			autofill.fields = [];
			for (var i = 0; i < arr.length; i++) {
				var item = arr[i].split(':');
				autofill.fields.push({ name: item[0], type: item[1] });
			}
		}

		if (tmp[3])
			autofill.skip = tmp[3].split(',').trim();

		if (tmp[5] && tmp[5].length > 2)
			autofill.sort = tmp[5];
	}

	var index = body.indexOf('.autoquery(');
	if (index !== -1) {
		tmp = body.substring(index + 10, body.indexOf(')', index)).split(/'|"/);

		autoquery = {};

		if (tmp[1]) {
			arr = tmp[1].split(',').trim();
			autoquery.fields = [];
			for (var i = 0; i < arr.length; i++) {
				var item = arr[i].split(':');
				autoquery.fields.push({ name: item[0], type: item[1] || 'String' });
			}
		}

		if (tmp[2] && tmp[2].length > 2)
			autoquery.sort = tmp[2];
	}

	console.log(queries);
	console.log(filters);
	console.log(params);
	console.log(autofill);
	console.log(autoquery);
	console.log('---');

}

FUNC.makedocs = function(text) {

	var lines = text.split('\n');
	var builder = [];
	var schema = null;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		if (line.indexOf('ROUTE(') !== -1) {
			// route
			continue;
		}

		if (line.indexOf('NEWSCHEMA(') !== -1) {

			var m = line.match(/'.*?'/);
			if (m == null)
				continue;

			schema = {};
			schema.name = m.toString().replace(/'/g, '');
			schema.prop = [];

			// new schema
			continue;
		}

		var index = line.indexOf('define(');
		if (index !== -1) {

			var prop = line.substring(index + 7).trim().replace(/'|"/g, '').split(',').trim();
			schema.prop.push({ name: prop[0], type: prop[1], required: !!prop[2] });

			// schema field
			continue;
		}

		if (line.indexOf('setSave(') !== -1) {
			continue;
		}

		if (line.indexOf('addWorkflow(') !== -1) {
			continue;
		}

		if (line.indexOf('setQuery(') !== -1) {
			continue;
		}

		if (line.indexOf('setRead(') !== -1) {
			continue;
		}

		if (line.indexOf('setRemove(') !== -1) {
			continue;
		}

		if (line.indexOf('setUpdate(') !== -1) {
			continue;
		}

		if (line.indexOf('setInsert(') !== -1) {
			continue;
		}

		if (line.indexOf('setPatch(') !== -1) {
			continue;
		}

		if (line.indexOf('addOperation(') !== -1) {
			continue;
		}

		if (line.indexOf('addTask(') !== -1) {
			continue;
		}

	}

	console.log(schema);
};

/*
console.log(FUNC.makedocs(`
	// Account
	ROUTE('GET    /account/', account);
	ROUTE('-GET   /account/login/{token}/    *Account/Login  --> @token');
	ROUTE('+GET /account/logout/         *Account/Login --> @logout');

	NEWSCHEMA('Account/Login', function(schema) {

		schema.define('login', 'Email', true);
		schema.define('password', 'String(30)', true);

		schema.addWorkflow('exec', function($) {

			var db = DBMS();
			var model = $.model;
			var builder = db.read('tbl_user');
			builder.where('login', model.login);
			builder.where('password', model.password.sha256(CONF.salt_password));
			builder.query('isremoved=FALSE');
			builder.fields('id,isconfirmed,isdisabled,name,roles,sa,contractid');
			builder.error('error-users-credentials');
			db.done($, function(response) {

				if (!response.isconfirmed) {
					$.invalid('error-users-unconfirmed');
					return;
				}

				if (response.isdisabled) {
					$.invalid('error-users-disabled');
					return;
				}

				var roles = {};
				for (var i = 0; i < response.roles.length; i++)
					roles[response.roles[i]] = 1;

				if (!roles.admin && !roles.assistant && !response.contractid) {
					$.invalid('error-users-contract');
					return;
				}

				var session = {};
				session.id = UID();
				session.ip = $.ip;
				session.ua = $.ua;
				session.isonline = true;
				session.dtexpire = NOW.add('1 month');
				session.dtcreated = NOW;
				session.userid = response.id;
				session.referrer = $.headers.referer || '';

				var id = session.id + '-' + session.userid + '-' + NOW.getTime();
				var sessionid = id.encrypt(CONF.salt_cookie);

				var db = DBMS();

				db.ins('tbl_user_session', session);
				db.log($, 'Account/Login.exec', response.id, null, response.name);

				$.controller.user = response;
				$.controller.cookie(CONF.cookie, sessionid, '1 month');
				$.success(true, sessionid);
			});

		});

		schema.addWorkflow('token', function($) {

			var token = FUNC.parsetoken($.id);

			if (!token) {
				$.invalid('error-account-token');
				return;
			}

			var builder = DBMS().read('tbl_user');
			builder.where('token', $.id);
			builder.query('isremoved=FALSE');
			builder.fields('id,isconfirmed,isdisabled,name');
			builder.error('error-account-token');
			builder.done($, function(response) {

				if (!response.isconfirmed) {
					$.invalid('error-users-unconfirmed');
					return;
				}

				if (response.isdisabled) {
					$.invalid('error-users-disabled');
					return;
				}

				var sessionid = FUNC.login($, response);
				$.controller.user = response;
				$.success(true, sessionid);
			});

		});

	});

`));
*/
analyze(`

			var token = FUNC.parsetoken($.id);

			if (!token) {
				$.invalid('error-account-token');
				return;
			}

			var builder = DBMS().read('tbl_user');
			builder.where('token', $.id);
			builder.where('search', $.query.search);
			builder.query('isremoved=FALSE');
			builder.fields('id,isconfirmed,isdisabled,name');
			builder.error('error-account-token');
			builder.done($, function(response) {

				if (!response.isconfirmed) {
					$.invalid('error-users-unconfirmed');
					return;
				}

				if (response.isdisabled) {
					$.invalid('error-users-disabled');
					return;
				}

				var sessionid = FUNC.login($, response);
				$.controller.user = response;
				$.success(true, sessionid);
			});

		});`);

analyze(`	schema.setQuery(function($) {

		if ($.query.type !== 'other' && FUNC.unauthorized($, 'Documents.query'))
			return;

		var builder = DBMS().list('tbl_document');
		builder.autofill($, 'id:UID,dtcreated:Date,dtupdated:Date', 'body', 'dtupdated_desc', 50);

		db.read('tbl_customer').id($.id).where('isremoved=FALSE').where('agencyid', $.user.agencyid).autoquery($.query, 'id,languageid,photo,firstname,lastname,gender,address,name,email,phone,company,companyid,companyvatid,companytaxid,companyaddress,color,icon,note,remind,ispriority,ispinned,iscompany,isactive,isonline,isdisabled,dtcreated,dtupdated,rate');

		if ($.query.type)
			builder.where('type', $.query.type);

		builder.query('isremoved=FALSE');
		builder.callback($.callback);
	});
`);