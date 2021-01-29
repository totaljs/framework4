NEWSCHEMA('Auth', function(schema) {

    schema.addWorkflow('exec', function($) {
        $.success({ user: $.user });
    }); 

});