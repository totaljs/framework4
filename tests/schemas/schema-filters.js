NEWSCHEMA('Schema/Filters', function(schema) {

	schema.addWorkflow('exec', function($) {
		$.success($.filter);
	}, 'string:String,number:Number,float:Number,email:Email,phone:Phone,boolean:Number,uid:UID,url:URL,object:Object,date:Number,json:JSON');

})