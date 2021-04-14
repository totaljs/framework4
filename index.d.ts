// Framework
type ls = (path: string, callback: (files: [], directories: []) => void, filter?: (path: string, isDirectory: boolean) => void) => void;
type ls2 = (path: string, callback: (files: [], directories: []) => void, filter?: (path: string, isDirectory: boolean) => void) => void;

type U = {
	ls: ls;
	ls2: ls2;
}

type ErrorBuilder = {

}

type FrameworkPath = {
	ls: ls; 
	ls2: ls2;
	join: () => any;
	verify: (name: string) => void;
	mkdir: (path: string, cache: boolean) => void;
	exists: (path: string, callback: (error: boolean, size: number, isfile: boolean) => void) => void;
	public: (filename: string) => string;
	public_cache: (filename: string) => string;
	private: (filename: string) => string;
	configs: (filename: string) => string;
	logs: (filename: string) => string;
	models: (filename: string) => string;
	builds: (filename: string) => string;
	temp: (filename: string) => string;
	temporary: (filename: string) => string;
	views: (filename: string) => string;
	updates: (filename: string) => string;
	workers: (filename: string) => string;
	filestorage: (name: string) => string;
	databases: (filename: string) => string;
	modules: (filename: string) => string;
	schemas: (filename: string) => string;
	operations: (filename: string) => string;
	tasks: (filename: string) => string;
	controllers: (filename: string) => string;
	definitions: (filename: string) => string;
	tests: (filename: string) => string;
	resources: (filename: string) => string;
	services: (filename: string) => string;
	packages: (filename: string) => string;
	themes: (filename: string) => string;
	components: (filename: string) => string;
	root: (filename: string) => string;
	package: (name: string, filename: string) => string;
}

declare function SUCCESS()

type SUCCESS = (success: boolean, value?: any) => { success: boolean, error: any, value: any};

type FrameworkImage	= {

}

// Utils
type ErrorResponse = (error: Error | null, response: any | null) => void;

// Dollar -> $
type Dollar = {
	body: any;
	controller: FrameworkController;
	files: File[];
	filter: object;
	headers: object;
	id: string;
	ip: string;
	language: string;
	model: object;
	params: object;
	query: object;
	req: Request;
	res: Response;
	session: object;
	sessionid: string;
	test: boolean;
	ua: string;
	user: object | null;
	audit: (message: string, type: string) => void;
	cancel: () => void;
	cookie: (name: string, value: string, expire: string, options: object) => string | void;
	done: (arg?: string | object | boolean) => ErrorResponse;
	invalid: (name: string | number, error?: string | number | Error) => void;
	success: (is?: boolean, value?: undefined) => void;
	successful: (callback: (response: any) => any) => ErrorResponse;
}

// Controller
type FrameworkController = {
	body: object;
	breadcrumb: object[];
	connections: object;
	exception: Error;
	files: File[];
	flags: string[];
	ip: string;
	isConnected: boolean;
	isController: boolean;
	keys: string[];
	language: string;
	mobile: boolean;
	name: string;
	online: number;
	options: object;
	params: object;
	path: FrameworkPath;
	query: object;
	referrer: string;
	repository: object;
	req: Request;
	res: Response;
	robot: boolean;
	route: object;
	schema: string;
	secured: boolean;
	session: object;
	sessionid: string;
	sitemap: string;
	split: string[];
	sseID: string;
	status: number;
	subdomain: string[];
	themename: string;
	ua: string;
	uri: object;
	url: string;
	user: object | null;
	workflow: string;
	xhr: boolean;
	autoclear: (enable?: boolean) => FrameworkController;
	autodestroy: (callback?: () => void) => FrameworkController;
	baa: (name?: string) => object;
	binary: (buffer: Buffer, contentType: string, type?: string, download?: string, headers?: object) => FrameworkController;
	callback: (view_name: string) => Function;
	cancel: () => FrameworkController;
	clear: () => FrameworkController;
	clients: () => FrameworkWebSocketClient[];
	close: (name?: string[]) => FrameworkController;
	componenet: (name: string, options?: object, model?: object) => string;
	content: (body: string, type: string, headers?: object) => FrameworkController;
	cookie: (name: string, value: string, expiration?: string | Date, options?: { domain?: string, path?: string, secure?: boolean, httponly?: boolean, security?: string }) => string | FrameworkController;
	csfr: () => string;
	custom: () => boolean;
	description: (value: string) => FrameworkController;
	destroy: (problem?: string) => FrameworkController;
	done: (arg?: boolean | object) => Function;
	empty: (headers?: object) => FrameworkController;
	error: (error: Error | string) => FrameworkController;
	file: (filename: string, download?: boolean, headers?: object, callback?: () => void) => FrameworkController;
	filefs: (name: string, id: string | number, download?: boolean, headers?: object, callback?: () => void, checkmeta?: (meta: object) => void) => FrameworkController; // @TODO - create meta type
	find: (id: (client: object, id: string) => boolean | string) => FrameworkWebSocketClient;
	head: (value: string) => string;
	header: (name: string, value: string) => FrameworkController;
	hostname: (path: string) => string;
	html: (body: string, headers?: object) => FrameworkController;
	image: (filename: string, maker: (image: FrameworkImage) => void, headers?: object, callback?: () => void) => FrameworkController;
	imagefs: (filename: string, id: string, maker: (image: FrameworkImage) => void, headers?: object, callback?: () => void, checkmeta?: (meta: object) => void) => FrameworkController;
	invalid: () => ErrorBuilder;
	json: (obj: object, headers?: object, beautify?: boolean, replacer?: () => void, ) => FrameworkController;
	jsonp: (method_name: string, obj: object, headers?: object, beautify?: boolean, replacer?: () => void) => FrameworkController;
	keywords: (value: string) => FrameworkController;
	layout: (name: string) => FrameworkController;
	mail: (address: string | string[], subject: string, name: string, model?: object, callback?: (err: any | null) => null, language?: string) => MailMessage;
	memorize: (key: string, expiration: Date | string, disabled?: boolean, fnTo?: () => void, fnFrom?: () => void) => FrameworkController;
	meta: (title: string, description?: string, keywords?: string, pictures?: string) => FrameworkController;
	nocache: () => FrameworkController;
	nocontent: (headers?: object) => FrameworkController;
	operation: (name: string, value: object, callback: ErrorResponse, options?: object) => FrameworkController;
}

// Schema
type SchemaValidation = (value?: any, model?: object) => void;
type SchemaMethodCallback = ($: SchemaOptions, model: any | null) => void;
type SchemaExtensionCallback = ($: SchemaOptions, model: any | null, next: () => void) => void;

type SchemaOptions = Dollar & {
	responses: object;
	callback: (error?: Error | string | null, value?: any) => void;
	extend: (data?: object, callback?: Function) => void;
	redirect: (error?: Error | string | null, value?: any) => void;
}

type SchemaCallback = {
	fields: string[];
	meta: object;
	name: string;
	schema: object;
	trim: boolean;
	allow: (field: string, field2?: string, field3?: string, field4?: string, field5?: string) => void;
	before: (name: string, fn: (value, model, index?, request?: Request) => void ) => void;
	cl: (name: string) => void;
	compress: () => void;
	csrf: () => void;
	encrpyt: (value?: any) => void;
	inherit: (group: string, name: string) => void;
	middleware: (fn: ($: SchemaOptions, next: () => void) => void) => void;
	props: (name: string) => object | object[];
	required: (name: string, required: (model: object) => boolean | boolean) => void;
	setPrefix: (prefix: string) => void;
	setResource: (name: string) => void;
	verify: (key: string, fn: ($: SchemaOptions) => void, cache: string) => void;
	define: (field: string, type: string, validation?: boolean | SchemaValidation) => void;
	addOperation: (name: string, operation: string, filter?: string) => void;
	addTask: (name: string, task: string, filter?: string) => void;
	addWorkflow: (name: string, callback: SchemaMethodCallback, filter?: string) => void;
	addWorkflowExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setInsert: (callback: SchemaMethodCallback, filter?: string) => void;
	setInsertExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setPatch: (callback: SchemaMethodCallback, filter?: string) => void;
	setPatchExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setQuery: (callback: SchemaMethodCallback, filter?: string) => void;
	setQueryExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setRead: (callback: SchemaMethodCallback, filter?: string) => void;
	setReadExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setRemove: (callback: SchemaMethodCallback, filter?: string) => void;
	setRemoveExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setSave: (callback: SchemaMethodCallback, filter?: string) => void;
	setSaveExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
	setUpdate: (callback: SchemaMethodCallback, filter?: string) => void;
	setUpdateExtension: (name: string, callbalck: SchemaExtensionCallback) => void;
}

declare function NEWSCHEMA(schema: string, callback: (schema: SchemaCallback) => void): void;

// Route
type RouteAction = () => void;

type Route = {}

declare function ROUTE(url: string, action?: RouteAction | string, flags?: string[], length?: number[]): Route;

// Operation
declare function NEWOPERATION(name: string, fn: ($: Operation) => void, repeat?: number, stop?: boolean, bind_error?: boolean, queryschema?: string);
declare function OPERATION(name: string, value: object, callback: ErrorResponse, options?: {}, controller?: FrameworkController);
declare function RUN(names: string, value: object, callback: ErrorResponse, options?: object, controller?: FrameworkController, response_name?: string);

type Operation = Dollar & {
	redirect: (error?: Error | string | null, value?: any) => void;
}

// Task
declare function NEWTASK(name: string, fn: (push: (task: string, callback: ($?: Task, value?: any) => void) => void) => void);
declare function TASK(name: string, callback: ErrorResponse, instance?: Dollar | FrameworkController, value?: object); 

type Task = Dollar & {
	end: (value?: object) => void;
	end2: (send_value?: boolean) => ErrorResponse;
	next: (task_name?: string) => void;
}

// Websocket
type FrameworkWebSocketClient = {
	
}

// Mail
type MailMessage = {

}