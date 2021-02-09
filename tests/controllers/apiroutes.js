exports.install = function() {

	ROUTE('API    /v1/    -api_basic           *APIRoutes   --> success');
	ROUTE('API    /v1/    +api_validation      *APIRoutes   --> success');
	ROUTE('API    /v1/    -api_novalidation    *APIRoutes   --> success');
	ROUTE('API    /v1/    #api_basic           *APIRoutes   --> success');

}