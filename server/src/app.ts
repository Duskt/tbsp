import { PathLike, promises as fs } from "fs";
import { App, AppOptions, HttpRequest, HttpResponse, TemplatedApp } from "uWebSockets.js";
type RouteStr = string;
type HttpCallback = (res: HttpResponse, req: HttpRequest) => void | Promise<void>;
type Responder = (req: HttpRequest) => Promise<Response>;

export async function fileResponder(path: PathLike) {
    console.log("fileResponder");
    let data = await fs.readFile(path, { encoding: 'utf8' });
    return new Response(data);
}

/*
 * I rewrite the express-like (res, req) syntax (which is flipped in uWebSockets.js; I assume to punish non-TS users) into an alternative (req) => res; this allows us to provide Response subtypes more easily, e.g. a FileResponse which automatically generates headers and reads binary. 
 */
function transformHttpCallback(httpcallback: Responder): HttpCallback {
    return async (res_dest, req) => {
	let res_src = await httpcallback(req);
	// send the body of the request
	res_dest.cork(() => {
	if (res_src.body !== null) {
	    let reader = res_src.body.getReader(); 
	    let body;
	    do {
		body = await reader.read();
		if (body.value === undefined) {
		    break;
		}
		res_dest.write(body.value);
	    } while (!body.done);
	}
	console.log("ending...");
	res_dest.end();
    });
}}

interface ServerOptions {
    port?: number;
};

/* A wrapper over the uWebSockets.js TemplatedApp interface, which is implemented in C++ and inaccessible to class hierarchy (heaven forbid!). 
 * */
export default class Server {
    port: number;
    private _uws: TemplatedApp;
    constructor({ port = 9001, }: ServerOptions) {
	this._uws = App();
	this.port = port;
    }
    get(route: RouteStr, callback: Responder) {
	this._uws.get(route, transformHttpCallback(callback));
	return this;
    }
    listen() {
	this._uws.listen(this.port, (listenSocket) => {
	    listenSocket ?
		console.log(`Listening on port ${this.port}...`) :
		console.log(`Failed to listen on port ${this.port}.`);
	});
	return this;
    }
    static(path: PathLike, route?: RouteStr) {
    }
}
