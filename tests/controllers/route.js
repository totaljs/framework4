exports.install = function() {

	// HTTP Methods
	ROUTE('GET       /methods/                                   *Methods              --> exec');
	ROUTE('POST      /methods/                                   *Methods              --> exec');
	ROUTE('PATCH     /methods/                                   *Methods              --> exec');
	ROUTE('PUT       /methods/                                   *Methods              --> exec');
	ROUTE('DELETE    /methods/                                   *Methods              --> exec');
	ROUTE('GET       /methods/wrong/                             *Methods              --> exec');

	// Params
	ROUTE('GET       /{id}/                                      *Params               --> params');
	ROUTE('GET       /params/{id}/                               *Params               --> params');
	ROUTE('GET       /params/alias/{id}/                         *Params               --> alias');
	ROUTE('GET       /params/is/inside/{id}/long/route/          *Params               --> params');
	ROUTE('GET       /params/is/inside/{id}/long/route/alias/    *Params               --> alias');
	ROUTE('GET       /params/{id}/{id2}/{id3}/alias/             *Params               --> alias');
	ROUTE('GET       /params/{id}/{id2}/{id3}/first/             *Params               --> params');
	ROUTE('GET       /params/{id}/{id2}/{id3}/second/            *Params               --> params2');
	ROUTE('GET       /params/{id}/{id2}/{id3}/third/             *Params               --> params3');

	// Wildcards
	ROUTE('GET       /wildcards/*/                               *Wildcards            --> exec');
	ROUTE('GET       /wildcards/*/route/                         *Wildcards            --> exec');
	ROUTE('GET       /wildcards/*/*/route/                       *Wildcards            --> exec');

	// Token
	ROUTE('GET       /xtoken/                                    *Headers              --> xtoken');

	// Auth
	ROUTE('GET       /auth/                                      *Auth                 --> exec');
	ROUTE('+GET      /auth/authorized/                           *Auth                 --> exec');
	ROUTE('-GET      /auth/unauthorized/                         *Auth                 --> exec');

};