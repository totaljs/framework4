exports.install = function() {

	ROUTE('API    /v1/    -api_basic           *APIRoutes   --> success');
	ROUTE('API    /v1/    +api_validation      *APIRoutes   --> success');
	ROUTE('API    /v1/    -api_novalidation    *APIRoutes   --> success');
	ROUTE('API    /v1/    #api_patch           *APIRoutes   --> success');
	ROUTE('API    /v1/    #api_keys            *APIRoutes   --> keys');
	ROUTE('API    /v1/    #api_keys_multi      *APIRoutes   --> one two keys (response)');

};