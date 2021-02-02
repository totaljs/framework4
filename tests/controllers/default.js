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

	// Schema - Methods
	ROUTE('GET       /schema/methods/query/                      *Schema/Methods                --> query');
	ROUTE('GET       /schema/methods/read/                       *Schema/Methods                --> read');
	ROUTE('GET       /schema/methods/insert/                     *Schema/Methods                --> insert');
	ROUTE('GET       /schema/methods/update/                     *Schema/Methods                --> update');
	ROUTE('GET       /schema/methods/patch/                      *Schema/Methods                --> patch');
	ROUTE('GET       /schema/methods/remove/                     *Schema/Methods                --> remove');
	ROUTE('GET       /schema/methods/workflow/                   *Schema/Methods                --> workflow');

	// Schema - Validation
	ROUTE('POST      /schema/formatting/                         *Schema/Formatting    --> exec');
	ROUTE('POST      /schema/required/                           *Schema/Required      --> exec');
	ROUTE('POST      /schema/notrequired/                        *Schema/Notrequired   --> exec');

	// Schema - Chaining
	ROUTE('POST      /schema/chaining/one/                       *Schema/Chaining    --> one (response) two');
	ROUTE('POST      /schema/chaining/two/                       *Schema/Chaining    --> one two (response)');

	// Schema - Extension
	ROUTE('GET      /schema/extensions/query/                    *Schema/Extensions    --> query');
	ROUTE('GET      /schema/extensions/read/                     *Schema/Extensions    --> read');
	ROUTE('GET      /schema/extensions/insert/                   *Schema/Extensions    --> insert');
	ROUTE('GET      /schema/extensions/patch/                    *Schema/Extensions    --> patch');
	ROUTE('GET      /schema/extensions/update/                   *Schema/Extensions    --> update');
	ROUTE('GET      /schema/extensions/remove/                   *Schema/Extensions    --> remove');
	ROUTE('GET      /schema/extensions/workflow/                 *Schema/Extensions    --> workflow');

};