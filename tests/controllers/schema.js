exports.install = function() {

	// Methods
	ROUTE('GET       /schema/methods/query/                      *Schema/Methods       --> query');
	ROUTE('GET       /schema/methods/read/                       *Schema/Methods       --> read');
	ROUTE('GET       /schema/methods/insert/                     *Schema/Methods       --> insert');
	ROUTE('GET       /schema/methods/update/                     *Schema/Methods       --> update');
	ROUTE('GET       /schema/methods/patch/                      *Schema/Methods       --> patch');
	ROUTE('GET       /schema/methods/remove/                     *Schema/Methods       --> remove');
	ROUTE('GET       /schema/methods/workflow/                   *Schema/Methods       --> workflow');

	// Methods (with data)
	ROUTE('POST       /schema/methods/query/                     *Schema/Methods       --> query');
	ROUTE('POST       /schema/methods/read/                      *Schema/Methods       --> read');
	ROUTE('POST       /schema/methods/insert/                    *Schema/Methods       --> insert');
	ROUTE('POST       /schema/methods/update/                    *Schema/Methods       --> update');
	ROUTE('POST       /schema/methods/patch/                     *Schema/Methods       --> patch');
	ROUTE('POST       /schema/methods/remove/                    *Schema/Methods       --> remove');
	ROUTE('POST       /schema/methods/workflow/                  *Schema/Methods       --> workflow');

	// Methods data validation
	ROUTE('GET       /schema/methods/validation/                 *Schema/MethodsValidation       --> exec');
	ROUTE('POST      /schema/methods/validation/                 *Schema/MethodsValidation       --> exec');
	ROUTE('PUT       /schema/methods/validation/                 *Schema/MethodsValidation       --> exec');
	ROUTE('PATCH     /schema/methods/validation/                 *Schema/MethodsValidation       --> exec');
	ROUTE('DELETE    /schema/methods/validation/                 *Schema/MethodsValidation       --> exec');

	// Validation
	ROUTE('POST      /schema/formatting/                         *Schema/Formatting    --> exec');
	ROUTE('POST      /schema/required/                           *Schema/Required      --> exec');
	ROUTE('POST      /schema/notrequired/                        *Schema/Notrequired   --> exec');

	// Chaining
	ROUTE('POST      /schema/chaining/one/                       *Schema/Chaining      --> one (response) two');
	ROUTE('POST      /schema/chaining/two/                       *Schema/Chaining      --> one two (response)');

	// Extension
	ROUTE('GET      /schema/extensions/query/                    *Schema/Extensions    --> query');
	ROUTE('GET      /schema/extensions/read/                     *Schema/Extensions    --> read');
	ROUTE('GET      /schema/extensions/insert/                   *Schema/Extensions    --> insert');
	ROUTE('GET      /schema/extensions/patch/                    *Schema/Extensions    --> patch');
	ROUTE('GET      /schema/extensions/update/                   *Schema/Extensions    --> update');
	ROUTE('GET      /schema/extensions/remove/                   *Schema/Extensions    --> remove');
	ROUTE('GET      /schema/extensions/workflow/                 *Schema/Extensions    --> workflow');

	// Filters
	ROUTE('POST     /schema/filters/                             *Schema/Filters       --> exec');

	// Verify
	ROUTE('POST     /schema/verify/                              *Schema/Verify        --> exec');

	// Middleware
	ROUTE('GET      /schema/middleware/valid/                    *Schema/Middleware    --> one');
	ROUTE('GET      /schema/middleware/invalid/                  *Schema/Middleware    --> two');

	// PATCH $.keys
	ROUTE('PATCH      /schema/patchkeys/                         *Schema/PatchKeys    --> exec');

}