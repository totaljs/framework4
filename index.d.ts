// Framework
type Framework = {
	is4: boolean
}

type ls = (path: string, callback: (files: [], directories: []) => void, filter?: (path: string, isDirectory: boolean) => void) => void;
type ls2 = (path: string, callback: (files: [], directories: []) => void, filter?: (path: string, isDirectory: boolean) => void) => void;

type FrameworkUtils = {
	ls: ls;
	ls2: ls2;
}

type Req = Request & {

}

type Res = Response & {

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

type FrameworkImage	= {

}

// Utils
type ErrorResponse = (error: any | null, response: any | null) => void;

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
	req: Req;
	res: Res;
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
	req: Req;
	res: Res;
	robot: boolean;
	route: object;
	schema: string;
	secured: boolean;
	session: object;
	sessionid: string;
	sitemapid: string;
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
	ping: () => FrameworkController;
	place: (name: string, value?: string) => FrameworkController;
	plain: (body: string, headers?: object) => FrameworkController;
	proxy: (opt: { headers?: object, method?: string, url: string, timeout?: number, callback?: (err, response) => void} | string) => FrameworkController;
	public_css: (name: string) => string;
	public_download: (name: string) => string;
	public_font: (name: string) => string;
	public_image: (name: string) => string;
	public_js: (name: string) => string;
	public_video: (name: string) => string;
	public: (name: string) => string;
	redirect: (url: string, permanent?: boolean) => FrameworkController;
	runtest: (url?: string, name?: string, callback?: (err, value) => void) => Test;
	section: (name: string, value?: string, replace?: boolean) => FrameworkController | string;
	send: (message: string | object, comparer?: (client, message) => void, replacer?: Function) => FrameworkController;
	sitemap_add: (parent: string, name: string, url: string) => any[];
	sitemap_change: (name: string, property: string, value: object) => any[];
	sitemap_name: (name: string, a?: object, b?: object, c?: object, d?: object, e?: object, f?: object) => string;
	sitemap_name2: (language: string, name: string, a?: object, b?: object, c?: object, d?: object, e?: object, f?: object) => string;
	sitemap_navigation: (parent: string, language?: string) => object[];
	sitemap_replace: (name: string, title: (current: string) => void | string, url : (current: string) => void | string) => any[];
	sitemap_url2: (language: string, name: string, a?: object, b?: object, c?: object, d?: object, e?: object, f?: object) => string;
	sitemap: (name?: string) => object[];
	sse: (data: string | object, name?: string, id?: string, retry?: number) => FrameworkController;
	stream: (contenetType: string, stream: ReadableStream, download?: string, headers?: object, callback?: () => void, oncompress?: boolean) => FrameworkController;
	success: (success?: boolean, value?: object) => FrameworkController;
	successful: (callback: (response: any) => void) => ErrorResponse;
	theme: (name: string) => FrameworkController;
	throw401: (problem?: string) => FrameworkController;
	throw403: (problem?: string) => FrameworkController;
	throw404: (problem?: string) => FrameworkController;
	throw409: (problem?: string) => FrameworkController;
	throw500: (err: Error) => FrameworkController;
	throw501: (problem?: string) => FrameworkController;
	view_compile: (body: string, model?: object, headers?: object, isPartial?: boolean, key?: string) => FrameworkController | string;
	view: (name: string, model?: object, headers?: object, isPartial?: boolean) => FrameworkController | string;
	view400: (problem?: string) => FrameworkController;
	view401: (problem?: string) => FrameworkController;
	view403: (problem?: string) => FrameworkController;
	view404: (problem?: string) => FrameworkController;
	view500: (err: Error) => FrameworkController;
	view501: (problem?: string) => FrameworkController;
	on: (event: string, callback: Function) => Framework;
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
	before: (name: string, fn: (value, model, index?, request?: Req) => void ) => void;
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
	addWorkflowExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setInsert: (callback: SchemaMethodCallback, filter?: string) => void;
	setInsertExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setPatch: (callback: SchemaMethodCallback, filter?: string) => void;
	setPatchExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setQuery: (callback: SchemaMethodCallback, filter?: string) => void;
	setQueryExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setRead: (callback: SchemaMethodCallback, filter?: string) => void;
	setReadExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setRemove: (callback: SchemaMethodCallback, filter?: string) => void;
	setRemoveExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setSave: (callback: SchemaMethodCallback, filter?: string) => void;
	setSaveExtension: (name: string, callback: SchemaExtensionCallback) => void;
	setUpdate: (callback: SchemaMethodCallback, filter?: string) => void;
	setUpdateExtension: (name: string, callback: SchemaExtensionCallback) => void;
}

// Route
type RouteAction = () => void;
type Route = {}

// Operation
type Operation = Dollar & {
	redirect: (error?: Error | string | null, value?: any) => void;
}

// Task
type Task = Dollar & {
	end: (value?: object) => void;
	end2: (send_value?: boolean) => ErrorResponse;
	next: (task_name?: string) => void;
}

// Websocket
type FrameworkWebSocketClient = {
	options: {
		type: string;
		compress: boolean;
		reconnect: number;
		encodedecode: boolean;
		reconnectserver: boolean;
	}
	closed: boolean;
	origin: string;
	protocol: string;
	url: string;
	headers: object;
	cookies: object;
	connect: (url: string, protocol?: string, origin?: string) => FrameworkWebSocketClient;
	close: (message?: string, code?: number) => FrameworkWebSocketClient;
	send: (message: string | object | Buffer) => FrameworkWebSocketClient;
	on: (event: string, fn: Function) => Framework;
}

// Mail
type FrameworkMail = {

}

type MailMessage = {

}

// Test
type Test = {

}

// Counter
type Counter = {
	clear: (callback: Function) => Counter;
	count: (id: string, callback: (err: any, count: any, meta: any) => void) => QueryBuilder;
	daily: (id: string, callback: ErrorResponse) => QueryBuilder;
	find: () => QueryBuilder;
	flush: () => QueryBuilder;
	hit: (id: string, count?: number) => Counter;
	monthly: (id: string, callback?: ErrorResponse) => QueryBuilder;
	remove: (id: string, callback?: (err: any) => void) => QueryBuilder;
	scalar: (type: string, field: string, callback?: ErrorResponse) => QueryBuilder;
	summarize: (type: string, callback?: ErrorResponse) => QueryBuilder;
	yearly: (id: string, callback?: ErrorResponse) => QueryBuilder;
}

type QueryBuilder = {

}

// FileStorage
type FileStorage = {
	name: string;
	size: number;
	total: number;
	browse: () => TextDBQueryBuilder;
	browse2: (callback: (err: any, files: any) => void) => void;
	clean: (callback?: (err: any) => void) => void;
	clear: (callback?: (err: any) => void) => void;
	count2: (callback: (err: any, count: any) => void) => void;
	image: (id: string, callback: (err: any, image: FrameworkImage) => void) => void;
	read: (id: string, callback: (err: any, response: any) => void, nostream?: boolean) => void;
	readbase64: (id: string, callback: (err: any, base64: any) => void) => void;
	readmeta: (id: string, callback: (err: any, meta: any) => void) => void;
	rebuild: (callback?: (err: any) => void) => void;
	remove: (id: string, callback?: (err: any) => void) => void;
	save: (id: string, name: string, data: string | Buffer | ReadableStream) => void;
	storage: (directory: string) => void;
}

// Flow
type Flow = {}

// TextDB
type TextDB = {}

type TextDBQueryBuilder = {}

// Request options
type RequestOptions = {
	url: string;
	encrypt?: string;
	xhr?: boolean;
	timeout?: number;
	encoding?: string;
	headers?: object;
	method?: string;
	proxy?: string;
	query?: object;
	unixsocket?: { socket: string, path: string };
	dnscache?: boolean;
	noredirect?: boolean;
	keepalive?: boolean;
	body?: object | string;
	cookies?: object;
	cook?: boolean;
	limit?: number;
	custom?: boolean;
	key?: Buffer;
	cert?: Buffer;
	dhparam?: string;
	nocookies?: boolean;
	ondata?: (chunks: Buffer, percentage: number) => void;
	onprogress?: (percentage: number) => void;
	files?: object;
	type?: string;
}

// ScheduleInstance
type ScheduleInstance = {

}

// ChildProcess
type ChildProcess = {

}

// RESTBuilder
type RESTBuilder = {
	accept: (type: string) => void;
	auth: (user: string, password?: string) => RESTBuilder;
	cache: (string) => RESTBuilder;
	callback: (callback: (err: Error | ErrorBuilder, response: object, output: { value: object, response: object | Buffer, status: number, headers: object, hostname: string, cache: boolean, cookie: (name: string) => string}) => void) => RESTBuilder;
	cert: (key: Buffer, cert: Buffer, dhparam?: Buffer) => RESTBuilder;
	convert: (inline_schema: string) => RESTBuilder;
	cook: (enable: boolean) => RESTBuilder;
	cookie: (name: string, value: string) => RESTBuilder;
	cookies: (value: object) => RESTBuilder;
	encrypt: (key: any) => RESTBuilder;
	error: (error: string | Function) => RESTBuilder;
	file: (name: string, filename: string, buffer?: Buffer) => RESTBuilder;
	header: (name: string, value: string) => RESTBuilder;
	json: (data: string | object) => RESTBuilder;
	keepalive: () => RESTBuilder;
	map: (schema: string) => RESTBuilder;
	maxlength: (value: number) => RESTBuilder;
	method: (value: string, data?: string | object) => RESTBuilder;
	mobile: () => RESTBuilder;
	nocache: () => RESTBuilder;
	nodnscache: () => RESTBuilder;
	origin: (value: string) => RESTBuilder;
	plain: (data?: string) => RESTBuilder;
	progress: (fn: (percentage: any) => void) => RESTBuilder;
	proxy: (url: string) => RESTBuilder;
	redirect: (enable: boolean) => RESTBuilder;
	referrer: (value: string) => RESTBuilder;
	rem: (key: string) => RESTBuilder;
	robot: () => RESTBuilder;
	schema: (name: string) => RESTBuilder;
	set: (key: string, value: object) => RESTBuilder;
	stream: (callback: (err: any, response: { stream: any, host: string, headers: object, status: number }) => void) => RESTBuilder;
	timeout: (value: number) => RESTBuilder;
	type: (new_content_type: string) => RESTBuilder;
	unixsocket: (socket: string, path: string) => RESTBuilder;
	url: (url: string) => RESTBuilder;
	urlencoded: (data?: string | object) => RESTBuilder;
	xhr: () => RESTBuilder;
	xml: (data: string, replace?: boolean) => RESTBuilder;
}

type RESTBuilderStaticMethods = {
	GET(url: string, data?: object): RESTBuilder;
	POST(url: string, data?: object): RESTBuilder;
	PUT(url: string, data?: object): RESTBuilder;
	DELETE(url: string, data?: object): RESTBuilder;
	PATCH(url: string, data?: object): RESTBuilder;
	API(url: string, operation: string, data?: object): RESTBuilder;
	HEAD(url: string): RESTBuilder;
	make: (fn: (builder: RESTBuilder) => void) => void;
	upgrade: (fn: (builder: RESTBuilder) => void) => void;
};

declare const RESTBuilder: RESTBuilderStaticMethods;

// Globals
declare function SUCCESS();
type SUCCESS = (success?: boolean, value?: any) => { success: boolean, error: any, value: any};
type DEF = {
	onAudit: (name: string, data: object) => void;
	onCompileScript: (filename: string, body: string) => void;
	onCompileStyle: (name: string, body: string) => void;
	onCompileView: (name: string, html: string) => void;
	onPrefLoad: (next: (pref_obj: object) => void) => void;
	onPrefSave: (PREF: object) => void;
}

declare const Builders: object;
declare const CONF: object;
declare const Controller: FrameworkController;
declare const DEBUG: boolean;
declare const DEF: DEF;
declare const EMPTYARRAY: [];
declare const EMPTYCONTROLLER: FrameworkController | object;
declare const EMPTYOBJECT: {};
declare const ErrorBuilder: ErrorBuilder;
declare const F: Framework;
declare const FUNC: object;
declare const isWORKER: boolean;
declare const Mail: FrameworkMail;
declare const MAIN: object;
declare const NOW: Date;
declare const Pagination;
declare const PREF: object;
declare const RELEASE: boolean;
declare const REPO: object;
declare const Thelpers;
declare const THREAD: string;
declare const U: FrameworkUtils;
declare const Utils: FrameworkUtils;

declare function ACTION(url: string, body: object, fn: ErrorResponse): void;
declare function AUDIT($: Dollar, message?: string, type?: string): void;
declare function AUTH(fn: ($: Dollar) => void): void;
declare function BLOCKED($: Dollar, limit?: number, expiration?: string): boolean;
declare function CACHE(key: string, value?: number, expire?: string, persistent?: boolean): object;
declare function CLEANUP(stream: ReadableStream, callback?: () => void): void;
declare function clearTimeout2(name: string): void;
declare function CLONECLEANUP(source: object, skip?: object): object;
declare function CMD(name: string, a?: object, b?: object, c?: object): void;
declare function CONVERT(obj: object, name: string): object;
declare function CORS(url: string, flags?: string[], credentials?: boolean): Framework;
declare function COUNTER(name: string): Counter;
declare function DECRYPTREQ(req: Req, val: object | string, key?: string): object | string;
declare function DESTROY(stream: ReadableStream): void;
declare function DIFFARR(name: string, arr_db: object[], arr_form: object[]): object;
declare function DOWNLOAD(url: string, filename: string, callback?: ErrorResponse, timeout?: number): void;
declare function EACHSCHEMA(group: string, fn: (group: string, name: string, schema: string) => void): any;
declare function EACHSCHEMA(fn: (group: string, name: string, schema: string) => void): any;
declare function EMIT(name: string, arg1?: object, arg2?: object, arg3?: object, arg4?: object, arg5?: object): void;
declare function EMIT2(name: string, arg1?: object, arg2?: object, arg3?: object, arg4?: object, arg5?: object): void;
declare function ENCRYPTREQ(req: Req, val: object | string, key?: string, strict?: boolean): string;
declare function ERROR(name: string): Function;
declare function EXEC(schema: string, model: object, callback: ErrorResponse, controller?: Dollar | FrameworkController): FrameworkController;
declare function FAKE(schema: string, required_only: boolean): object;
declare function FILE404(action: (req: Req, res: Res) => void): void;
declare function FILESTORAGE(name: string): FileStorage;
declare function FINISHED(stream: ReadableStream | Res | Req, callback: (err: any) => void): void;
declare function FLOWSTREAM(name?: string): Flow;
declare function GETSCHEMA(schema: string, callback: (err: any, schema: any) => void, timeout?: number): any;
declare function GETSCHEMA(schema: string): any;
declare function GROUP(flags: string | string[], action: () => void): Framework;
declare function GROUP(action: () => void): Framework;
declare function GUID(length?: number): string;
declare function HTMLMAIL(address: string | string[], subject: string, html: string, callback?: (err: any) => void, language?: string): MailMessage;
declare function IMPORT(url: string, callback?: (err: any, module: any, response: any) => void): void;
declare function LDAP(options: { ldap: { host: string, port?: number }, user: string, password: string, dn?: string, type: string }, callback: ErrorResponse): void;
declare function LOAD(types: string | string[], path?: string, callback?: () => void): void;
declare function LOCALIZE(fn: (req: Req, res: Res) => void): void;
declare function LOGGER(filename: string, param1?: any, param2?: any, param3?: any, param4?: any, param5?: any): void;
declare function LOGMAIL(address: string | string[], subject: string, body: string, callback?: (err: any) => void): Framework;
declare function MAIL(address: string | string[], subject: string, view_name: string, model?: object, callback?: (err: any) => void, language?: string): MailMessage;
declare function MAKE(name?: string, fn?: (obj: object) => void): object;
declare function MAP(url: string, filename: string, extension?: string[]): Framework;
declare function MAPSCHEMA(schema: string, prop_pk?: string): void;
declare function MERGE(url: string, filename1: string, filename2: string, filename3?: string, filename4?: string, filename5?: string): void;
declare function MIDDLEWARE(name: string, fn: ($: Dollar | null) => void, assign?: string | string[], fisrt?: boolean): void;
declare function MODEL(name: string): object;
declare function MODIFY(fn: (type: string, filename: string, value: string, controller: FrameworkController | undefined) => any): object;
declare function MODULE(name: string): object;
declare function NEWCOMMAND(name: string, callback: Function | null): object;
declare function NEWOPERATION(name: string, fn: ($: Operation) => void, repeat?: number, stop?: boolean, bind_error?: boolean, queryschema?: string);
declare function NEWSCHEMA(schema: string, callback: (schema: SchemaCallback) => void): void;
declare function NEWTASK(name: string, fn: (push: (task: string, callback: ($?: Task, value?: any) => void) => void) => void);
declare function NOOP(): () => void;
declare function NOSQL(name: string): () => TextDB;
declare function NPMINSTALL(name: string, callback: (err: any) => void): void;
declare function OFF(name: string, callback?: () => void): Framework;
declare function ON(name: string, callback: () => void): Framework;
declare function ONCE(name: string, callback: () => void): Framework;
declare function OPERATION(name: string, value: object, callback: ErrorResponse, options?: {}, controller?: FrameworkController);
declare function PAUSE(pause: boolean): void;
declare function PAUSERUN(label: string): void;
declare function PROXY(endpoint: string, hostname: string, copypath?: boolean, before?: (uri: any, req: Req, res: Res) => void, after?: (res: any) => void, timeout?: number): void;
declare function QUERIFY(url: string, data: object): void;
declare function REDIRECT(path: string, host: string, copypath?: boolean, permanent?: boolean): void;
declare function REQUEST(options: RequestOptions, callback?: () => void): void;
declare function REQUIRE(path: string): object;
declare function RESOURCE(name: string, key: string): object;
declare function ROUTE(url: string, action?: RouteAction | string, flags?: string[], length?: number[]): Route;
declare function RUN(names: string, value: object, callback: ErrorResponse, options?: object, controller?: FrameworkController, response_name?: string);
declare function SCHEDULE(date: string | number | Date, repeat?: string, fn?: () => void): ScheduleInstance;
declare function SESSION(name?: string, ondata?: Function): object
declare function setTimeout2(name: string, fn: (arg: any) => void, timeout: number, limit?: number, arg?: object): void;
declare function SITEMAP(id: string, first?: boolean, language?: string): object[];
declare function TABLE(name: string): TextDB;
declare function TASK(name: string, callback: ErrorResponse, instance?: Dollar | FrameworkController, value?: object); 
declare function TotalAPI(token: string, name: string, data: object, callback: any, filename?: string)
declare function TOUCH(url: string): void;
declare function TRANSLATE(language: string, text: string): string;
declare function TRANSLATOR(language: string, text: string): string;
declare function UID(type?: string): string;
declare function UNAUTHORIZED($: Dollar, roleA: string, roleB?: string, roleC?: string, roleD?: string, roleE?: string): string;
declare function UPDATE(versions: string[], callback: (err: any) => void, pause_server_message: string): string;
declare function VIEW(name: string, model?: object, layout?: string, repository?: object, language?: string): string;
declare function VIEWCOMPILE(html: string, model?: object, layout?: string, repository?: object, language?: string, key?: string): string;
declare function WAIT(validator: Function, callback: ErrorResponse, timeout?: number, interval?: number): boolean;
declare function WEBSOCKETCLIENT(callback: (client: FrameworkWebSocketClient) => void): void;
declare function WORKER(name: string, timeout?: number, args?: string[]): ChildProcess;
declare function WORKER2(name: string, timeout?: number, callback?: (err: any, buffer: Buffer) => void): ChildProcess;
declare function WORKFLOW(declaration: ($: Dollar) => void): Dollar;
declare function HTTP(type: string): void;