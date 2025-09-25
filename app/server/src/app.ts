import { RouterTypes } from 'bun';
import { WSMsg, read, write } from '@tbsp/web/ws/protocol.ts';
import { HTTPRegister, RouteRegister } from '@tbsp/web';
import WebSocketRegister, { TbspWebSocketHandler } from '@tbsp/web/ws';
import fs from 'node:fs';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RoutePath = string;

type RouteHandler = RouterTypes.RouteHandler<string>;

type RegisterObject<Key extends string, Handler> = {
  [K in Key]?: Handler;
};
type HttpRouteObject = {
  [path: string]: RegisterObject<HTTPMethod, RouteHandler>;
};

const upgrade: RouteHandler = (req, server) => {
  // I think the response we return is overridden
  server.upgrade(req, { data: { origin: new URL(req.url) } });
  return new Response(null, { status: 101 });
};

function respondOrUpgrade(handler: RouteHandler): RouteHandler {
  return (req, server) => {
    let isUpgrade = req.headers.get('upgrade');
    if (isUpgrade === 'websocket') return upgrade(req, server);
    return handler(req, server);
  };
}

function debugPath<T>(path: string, fallback: T) {
  try {
    fs.accessSync(path);
  } catch {
    console.error(`Failed to access file at ${path} (resolved from ${process.cwd()}).`);
    return fallback;
  }
}

/**
 * Serve a response from a file at `path`.
 * This uses the environment variable `DEV` (development mode)
 * to define its behaviour. (It's a wrapper around `Bun.file`)
 * - in development: read the file and send the content
 * - in production: load the file into memory immediately and send content on request without fs IO
 */
function File(path: string, preload = false) {
  let r = debugPath(path, () => new Response('Resource not found.', { status: 404 }));
  if (r) return r;

  if (preload) {
    return async () => new Response(await Bun.file(path).bytes());
  } else {
    return () => new Response(Bun.file(path));
  }
}

function PublicDirectory(basePath: string, preload = false, prefix = '') {
  basePath = basePath.endsWith('/') ? basePath.slice(0, basePath.length - 1) : basePath;
  let app = new TBSPApp();

  let r = debugPath(basePath, app);
  if (r) return r;

  for (let item of fs.readdirSync(basePath)) {
    let itemPath = `${basePath}/${item}`;
    if (debugPath(itemPath, true)) continue;

    if (fs.statSync(itemPath).isDirectory()) {
      app.use(PublicDirectory(`${basePath}/${item}`, preload, `${item}/`));
    } else {
      // console.log(`Registered file ${itemPath} at /${prefix}${item}`);
      app.get(`/${prefix}${item}`, File(itemPath, preload));
    }
  }
  return app;
}

function displayObject(obj: object, tabWidth = 4): string {
  return (
    '{\n' +
    Object.entries(obj)
      .map(
        ([k, v]) =>
          ' '.repeat(tabWidth) +
          k +
          ': ' +
          (typeof v === 'object' ? displayObject(v) : (v as string)),
      )
      .join('\n') +
    '\n}'
  );
}

/**
 * Wrapper around `Bun.serve` API for HTTP server.
 * Uses method chaining to build a configuration object and promotes abstraction of RouteHandlers.
 * This is still missing features that might need to be implemented.
 */
class TBSPApp {
  httpRegisters: Map<RoutePath, HTTPRegister<string>>;
  wsRegisters: Map<RoutePath, WebSocketRegister<'server'>>;
  logDebug: boolean;
  constructor() {
    this.httpRegisters = new Map();
    this.wsRegisters = new Map();
    this.logDebug = false;
  }

  debug(msg: string) {
    if (!this.logDebug) return;
    console.log(msg);
  }

  displayRegisterMap(register: Map<string, { display: () => string }>, linePrefix = '') {
    return register
      .entries()
      .map(([_, reg]) => linePrefix + reg.display())
      .toArray()
      .join('\n');
  }

  displayRegisters() {
    return `HttpRegisters:\n${this.displayRegisterMap(this.httpRegisters, '- ')}\n\nWebSocketRegisters:\n${this.displayRegisterMap(this.wsRegisters, '- ')}`;
  }

  route(method: HTTPMethod, path: string, handler: RouteHandler) {
    this.debug(`Adding route at ${path} (${method}).`);
    let reg = this.httpRegisters.get(path);
    if (reg === undefined) {
      reg = new HTTPRegister(path);
      this.httpRegisters.set(path, reg);
    }
    reg.addRoute(method, handler);

    // method chaining
    return this;
  }

  get(path: string, handler: RouteHandler) {
    return this.route('GET', path, handler);
  }
  post(path: string, handler: RouteHandler) {
    return this.route('POST', path, handler);
  }
  put(path: string, handler: RouteHandler) {
    return this.route('PUT', path, handler);
  }
  delete(path: string, handler: RouteHandler) {
    return this.route('DELETE', path, handler);
  }

  use(plugin: TBSPApp) {
    plugin.httpRegisters.forEach((reg, path) => {
      if (this.httpRegisters.has(path)) {
        throw new Error(
          `Using TBSPApp plugin which listens at ${path} but a listener was already set.`,
        );
      }
      this.httpRegisters.set(path, reg);
    });

    return this;
  }

  websocket(
    path: string,
    wsRegisterConstructor: (ws: WebSocketRegister<'server'>) => WebSocketRegister<'server'> | void,
  ) {
    // call the new constructor with a new register
    let newRegister = new WebSocketRegister(path);
    let r = wsRegisterConstructor(newRegister);
    // allow returned value to override for more flexibility
    if (r !== undefined) newRegister = r;

    // merge if one already exists at path
    let reg = this.wsRegisters.get(path);
    if (reg === undefined) {
      this.wsRegisters.set(path, newRegister);
    } else {
      reg.merge(newRegister);
    }

    // method chaining
    return this;
  }

  getRoutes(): HttpRouteObject {
    this.debug(this.displayRegisters());
    let allPaths = new Set(
      Array.from(this.httpRegisters.keys()).concat(...this.wsRegisters.keys()),
    );

    // The JS 'Set' object is a not-so-subtle wrapper around Map (Set<v>.entries => [v, v][])
    let routeEntries: MapIterator<[string, { [method: string]: RouteHandler }]> = allPaths
      .keys()
      .map((path) => {
        let httpReg = this.httpRegisters.get(path);
        let wsReg = this.wsRegisters.get(path);
        this.debug(
          `Merging at ${path}: ${httpReg ? httpReg.display() : undefined} (HTTP) with ${wsReg ? wsReg.display() : undefined} (WS)`,
        );
        if (httpReg === undefined) {
          if (wsReg !== undefined) {
            httpReg = new HTTPRegister(path);
            httpReg.addRoute('GET', upgrade);
          } else {
            throw new Error(
              'Somehow a path was taken from HTTP / WS registers but had no attached register. The only way this could have happened is if you did `.httpOrWsRegisters.set(path, undefined)`.',
            );
          }
        } else if (wsReg !== undefined) {
          let httpGetHandler = httpReg.handlers['GET'];
          if (httpGetHandler === undefined) {
            this.debug('Inserted into empty GET handler.');
            // Add HTTP GET handler which upgrades to websocket let http
            httpReg.addRoute('GET', upgrade);
          } else {
            // check for header 'upgrade: websocket' to either upgrade or defer to http handler
            httpReg.handlers['GET'] = respondOrUpgrade(httpGetHandler);
          }
        } // otherwise httpReg only - leave it alone
        return [path, httpReg.handlersObject()];
      });

    return Object.fromEntries(routeEntries);
  }

  getCompiledWebSocket(): Bun.WebSocketHandler<{ origin: URL }> {
    let debug = this.logDebug ? console.log : (msg: string) => {};
    let wsRegisters = this.wsRegisters;
    let websocket: Bun.WebSocketHandler<{ origin: URL }> = {
      async message(ws, message: Buffer<ArrayBuffer>) {
        let decodedMsg = await read(new Blob([message]));
        debug(`Got message ${message.toString()} which decoded to ${decodedMsg}`);
        if (decodedMsg instanceof Error) {
          console.error(
            `Couldn't decode message ${message}: possible other formats: utf8 ${message.toString('utf8')}`,
          );
          return;
        }

        let path = ws.data.origin.pathname;

        wsRegisters.forEach((wsReg, wsPath) => {
          debug(`Checking register ${wsReg} (at ${wsPath}) for match at ${path}`);
          if (wsPath !== path) return; // TODO: match globs, pass params, etc
          let msgCallbacks = wsReg.handlers['message'];
          debug(`Matched. Got onmessage callbacks: ${msgCallbacks}`);
          if (msgCallbacks === undefined) return;
          for (let f of msgCallbacks as TbspWebSocketHandler<'message'>[]) {
            f(ws, decodedMsg);
          }
        });
      },
      open(ws) {
        debug(`Opened WebSocket connection from ${ws.data.origin}.`);
        wsRegisters.values().forEach((wsReg) => {
          wsReg.match(ws.data.origin.pathname, 'open', [ws]);
        });
      },
    };
    return websocket;
  }

  start(port: number) {
    let routes = this.getRoutes();
    this.debug(`Compiled routes: ${displayObject(routes)}`);
    let websocket = this.getCompiledWebSocket();
    this.debug(`Compiled Bun.WebSocketHandler: ${displayObject(websocket)}`);
    Bun.serve({
      development: true,
      port,
      // convert our mutable Map to an object { '/path': { 'GET': <handler> } }
      routes,
      websocket,
      fetch(req, server) {
        let origin = new URL(req.url);
        console.log(`Fallback at ${origin}`);
        if (origin.protocol.startsWith('http')) {
          return new Response('Resource not found.', { status: 404 });
        }
      },
    });
    console.log(`Listening at http://localhost:${port}`);
  }
}

let x = new TBSPApp()
  .use(PublicDirectory('app/client/dist/'))
  .get('/', File('app/client/dist/index.html'))
  .websocket('/', (ws) =>
    ws
      .onopen((ws) => console.log('Got WS conn.'))
      .onmessage((ws, msg) => console.log('omg it worked', msg)),
  )
  .start(9001);
