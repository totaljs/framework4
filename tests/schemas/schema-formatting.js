NEWSCHEMA('Schema/Formatting', function(schema) {

    // Number
    schema.define('number', 'Number');
    //schema.define('number_wrong', 'Number');
    //schema.define('number_required', 'Number', true);
    schema.define('number_float', 'Number');
    //schema.define('number_float_required', 'Number', true);

    // Strings
    schema.define('string', 'String');
    //schema.define('string_wrong', 'String');
    //schema.define('string_required', 'String', true);
    //schema.define('string_less', 'String(3)');
    //schema.define('string_more', 'String(3)');
    //schema.define('string_equal', 'String(3)');
    
    // Name
    schema.define('string_name', 'Name');
    //schema.define('string_name_less', 'Name(5)');
    //schema.define('string_name_more', 'Name(5)');
    //schema.define('string_name_equal', 'Name(5)');

    // Capitalize
    schema.define('string_capitalize', 'Capitalize');
    // schema.define('string_capitalize_less', 'Capitalize(3)');
    // schema.define('string_capitalize_more', 'Capitalize(3)');
    // schema.define('string_capitalize_equal', 'Capitalize(3)');

    // Capitalize 2
    schema.define('string_capitalize2', 'Capitalize2');
    // schema.define('string_capitalize2_less', 'Capitalize2(3)');
    // schema.define('string_capitalize2_more', 'Capitalize2(3)');
    // schema.define('string_capitalize2_equal', 'Capitalize2(3)');

    // Lowercase
    schema.define('string_lowercase', 'Lowercase');
    // schema.define('string_lowercase_less', 'Lowercase(3)');
    // schema.define('string_lowercase_more', 'Lowercase(3)');
    // schema.define('string_lowercase_equal', 'Lowercase(3)');

    // Uppercase
    schema.define('string_uppercase', 'Uppercase');
    // schema.define('string_uppercase_less', 'Uppercase(3)');
    // schema.define('string_uppercase_more', 'Uppercase(3)');
    // schema.define('string_uppercase_equal', 'Uppercase(3)');

    // UID
    // schema.define('uid', 'UID');
    //schema.define('uid_required', 'UID');
    //schema.define('uid_wrong', 'UID');

    schema.addWorkflow('exec', function($, model) {
        $.callback(model);
    });

});