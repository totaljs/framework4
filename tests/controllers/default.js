exports.install = function() {

	// Names
	ROUTE('GET       /names/query/                               *Names                --> query');
	ROUTE('GET       /names/read/                                *Names                --> read');
	ROUTE('GET       /names/insert/                              *Names                --> insert');
	ROUTE('GET       /names/update/                              *Names                --> update');
	ROUTE('GET       /names/patch/                               *Names                --> patch');
	ROUTE('GET       /names/remove/                              *Names                --> remove');
	ROUTE('GET       /names/workflow/                            *Names                --> workflow');

	// Methods
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

	// Token
	ROUTE('GET       /xtoken/                                    *Headers              --> xtoken');

	// Auth
	ROUTE('GET       /auth/                                      *Auth                 --> exec');
	ROUTE('+GET      /auth/authorized/                           *Auth                 --> exec');
	ROUTE('-GET      /auth/unauthorized/                         *Auth                 --> exec');

	// Schema - Validation
	ROUTE('POST      /schema/formatting/                         *Schema/Formatting    --> exec');
	ROUTE('POST      /schema/required/                           *Schema/Required      --> exec');
	ROUTE('POST      /schema/notrequired/                        *Schema/Notrequired   --> exec');
};