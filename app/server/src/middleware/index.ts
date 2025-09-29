import { type RouterTypes } from 'bun';
import { type WSMsg, read, write } from '@tbsp/web/ws/protocol.ts';
import { HTTPRegister } from '@tbsp/web';
import WebSocketRegister, { type TbspWebSocketHandler } from '@tbsp/web/ws';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RoutePath = string;

type RouteHandler = RouterTypes.RouteHandler<string>;

type RegisterObject<Key extends string, Handler> = {
  [K in Key]?: Handler;
};
type HttpRouteObject = {
  [path: string]: RegisterObject<HTTPMethod, RouteHandler>;
};

function checkDev(...vars: string[]) {
  for (const v of vars) {
    let value = import.meta.env[v];
    if (value !== undefined && value !== '') {
      console.log(`Found environment variable ${v} (='${value}'); enabling development mode.`);
      return true;
    }
  }
  return false;
}

const DEV_MODE = checkDev('DEV', 'DEV_MODE', 'DEVELOPMENT', 'DEVELOPMENT_MODE');

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

interface TBSPAppInitOptions {
  logDebug?: boolean;
}

/**
 * Wrapper around `Bun.serve` API for HTTP server.
 * Uses method chaining to build a configuration object and promotes abstraction of RouteHandlers.
 * This is still missing features that might need to be implemented.
 */
export default class TBSPApp {
  httpRegisters: Map<RoutePath, HTTPRegister<string>>;
  wsRegisters: Map<RoutePath, WebSocketRegister<'server'>>;
  logDebug: boolean;
  constructor(init?: TBSPAppInitOptions) {
    let { logDebug = false } = init ?? {};
    this.httpRegisters = new Map();
    this.wsRegisters = new Map();
    this.logDebug = logDebug;
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
        for (const i of path) {
          if (['*', ':', '?', '('].includes(i))
            throw new Error(
              'TBSP TODO: Ensure WebSocket/HTTP paths with matching URL patterns do not collide; use Bun API.',
            ); // TODO
        }
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
    let debug = this.logDebug ? console.log : (_: string) => {};
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
