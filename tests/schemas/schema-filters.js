NEWSCHEMA('Schema/Filters', function(schema) {

	schema.addWorkflow('exec', function($) {
		$.success($.filter);
	}, 'string:String,number:Number,float:Number,email:Email,phone:Phone,boolean:Boolean,uid:UID,url:URL,date:Number,json:JSON');

});