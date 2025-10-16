import { type RouterTypes } from 'bun';
import HttpRegister, { HttpMethodRegister, type HttpMethod } from './register/http.ts';
import WebSocketRegister, { WebSocketEventRegister } from './register/ws.ts';
import { DEBUG_MODE } from './env.ts';
import type { RouteString } from './route.ts';

type RouteHandler = RouterTypes.RouteHandler<string>;

interface TBSPAppInitOptions {
  logDebug?: boolean;
}

/**
 * Wrapper around `Bun.serve` API for HTTP server.
 * Uses method chaining to build a configuration object and promotes abstraction of RouteHandlers.
 * This is still missing features that might need to be implemented.
 */
export default class TBSPApp {
  httpRegister: HttpRegister;
  wsRegister: WebSocketRegister;
  logDebug: boolean;
  constructor(init?: TBSPAppInitOptions) {
    let { logDebug = DEBUG_MODE } = init ?? {};
    this.httpRegister = new HttpRegister();
    this.wsRegister = new WebSocketRegister();
    this.logDebug = logDebug;
  }

  debug(...msg: any) {
    if (!this.logDebug) return;
    console.log(...msg);
  }

  toString() {
    return `HttpRegisters:\n${this.httpRegister}\n\nWebSocketRegisters:\n${this.wsRegister}`;
  }

  route(method: HttpMethod, path: RouteString, handler: RouteHandler) {
    this.debug(`Adding route at ${path} (${method}).`);
    let methodReg = this.httpRegister.get(path);
    if (methodReg === undefined) {
      methodReg = new HttpMethodRegister(path);
      this.httpRegister.set(path, methodReg);
    }
    methodReg.addRoute(method, handler);
    return this;
  }

  get(path: RouteString, handler: RouteHandler) {
    return this.route('GET', path, handler);
  }
  post(path: RouteString, handler: RouteHandler) {
    return this.route('POST', path, handler);
  }
  put(path: RouteString, handler: RouteHandler) {
    return this.route('PUT', path, handler);
  }
  delete(path: RouteString, handler: RouteHandler) {
    return this.route('DELETE', path, handler);
  }

  use(plugin: TBSPApp): this {
    for (const k of plugin.wsRegister.keys()) {
      let v = plugin.wsRegister.get(k);
      if (v === undefined) continue;
      this.wsRegister.register(k, v);
    }
    for (const k of plugin.httpRegister.keys()) {
      let v = plugin.httpRegister.get(k);
      if (v === undefined) continue;
      this.httpRegister.register(k, v);
    }
    return this;
  }

  websocket(path: RouteString, wsCallback: (ws: WebSocketEventRegister<'server'>) => void) {
    let newWsEventRegister = new WebSocketEventRegister<'server'>();
    // allow returned value to override for more flexibility
    newWsEventRegister = wsCallback(newWsEventRegister) ?? newWsEventRegister;
    // this will mergeAll if one already exists :)
    this.wsRegister.register(path, newWsEventRegister);
    return this;
  }

  start(port: number) {
    // !!!
    // Bun does not route HTTP GET requests with a websocket upgrade attached
    // through provided HTTP routes. So our HTTP GET requests don't need to check for this,
    // only our fallback needs to match the origin.
    let wsMatchOrigin = (path: string): boolean =>
      this.wsRegister.entries().find(([route]) => route.matchPath(path)) !== undefined;
    Bun.serve({
      port,
      routes: this.httpRegister.compile(),
      websocket: this.wsRegister.compile(this.logDebug),
      development: true,
      fetch(req, server) {
        let origin = new URL(req.url);
        if (wsMatchOrigin(origin.pathname)) {
          server.upgrade(req, { data: { origin: new URL(req.url) } });
          return;
        }
        console.log('Fallback at', req);
        if (origin.protocol.startsWith('http')) {
          return new Response('Resource not found.', { status: 404 });
        }
      },
    });
    console.log(`Listening at http://localhost:${port}`);
  }
}
