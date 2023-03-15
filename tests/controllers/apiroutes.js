exports.install = function() {

	ROUTE('API    /v1/    -api_basic                  *APIRoutes   --> success');
	ROUTE('API    /v1/    +api_validation             *APIRoutes   --> success');
	ROUTE('API    /v1/    -api_novalidation           *APIRoutes   --> success');
	ROUTE('API    /v1/    #api_patch                  *APIRoutes   --> success');
	ROUTE('API    /v1/    #api_keys                   *APIRoutes   --> keys');
	ROUTE('API    /v1/    #api_keys_multi             *APIRoutes   --> one two keys (response)');

	ROUTE('API    /v1/    -api_action_basic          *   --> success');
	ROUTE('API    /v1/    +api_action_validation     *   --> success');
	ROUTE('API    /v1/    -api_action_novalidation   *   --> success');
	ROUTE('API    /v1/    #api_action_patch          *   --> success');
	ROUTE('API    /v1/    #api_action_keys           *   --> keys');
	ROUTE('API    /v1/    #api_action_keys_multi     *   --> one two keys (response)');

};