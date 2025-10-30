import type { RouterTypes } from 'bun';
import { DEBUG_MODE } from './env.ts';
import { HttpRouter, type HttpMethod, type HttpRouteHandler } from './register/http.ts';
import type { RouteString } from './route.ts';
import type {
  App,
  ClientWSConnection,
  ServerWebSocketRegister,
  WsMsgProtocol,
  WsMsgReader,
} from './types.ts';
import { WebSocketRouter } from './ws/server.ts';

type RouteHandler = RouterTypes.RouteHandler<string>;

interface AppInitOptions<Protocol extends WsMsgProtocol, WSConn> {
  read: WsMsgReader<Protocol>;
  clientWsConnFactory: (ws: Bun.ServerWebSocket<any>) => WSConn;
  logDebug?: boolean;
}

/**
 * Wrapper around `Bun.serve` API for HTTP server.
 * Uses method chaining to build a configuration object and promotes abstraction of RouteHandlers.
 * This is still missing features that might need to be implemented.
 */
export class BaseApp<Protocol extends WsMsgProtocol, WSConn extends ClientWSConnection>
  implements App<Protocol, WSConn>
{
  httpRouter: HttpRouter;
  wsRouter: WebSocketRouter<Protocol, WSConn>;
  logDebug: boolean;
  constructor({
    read,
    logDebug = DEBUG_MODE,
    clientWsConnFactory,
  }: AppInitOptions<Protocol, WSConn>) {
    this.httpRouter = new HttpRouter();
    this.wsRouter = new WebSocketRouter(read, clientWsConnFactory);
    this.logDebug = logDebug;
  }

  debug(...msg: any) {
    if (!this.logDebug) return;
    console.log(...msg);
  }

  toString() {
    return `HttpRegisters:\n${this.httpRouter}\n\nWebSocketRegisters:\n${this.wsRouter}`;
  }

  route<M extends HttpMethod, P extends RouteString>(
    method: M,
    path: P,
    handler: HttpRouteHandler<P>,
  ): this {
    this.debug(`Adding route at ${path} (${method}).`);
    this.httpRouter.route(path, method, handler);
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

  use(plugin: this): this {
    this.wsRouter.absorb(plugin.wsRouter);
    this.httpRouter.absorb(plugin.httpRouter);
    return this;
  }

  websocket(
    path: RouteString,
    wsCallback: (register: ServerWebSocketRegister<Protocol, WSConn>) => void,
  ) {
    let reg = this.wsRouter.get(path);
    // allow returned value to override for more flexibility
    reg = wsCallback(reg) ?? reg;
    // this will mergeAll if one already exists :)
    this.wsRouter.set(path, reg);
    return this;
  }

  start(port: number) {
    // !!!
    // Bun does not route HTTP GET requests with a websocket upgrade attached
    // through provided HTTP routes. So our HTTP GET requests don't need to check for this,
    // only our fallback needs to match the origin.
    let wsMatchOrigin = (path: string): boolean =>
      this.wsRouter.routeEntries().find(([route]) => route.matchPath(path)) !== undefined;
    Bun.serve({
      port,
      routes: this.httpRouter.compile(),
      websocket: this.wsRouter.compile(this.logDebug),
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

export class BunApp<Protocol extends WsMsgProtocol> extends BaseApp<
  Protocol,
  Bun.ServerWebSocket<{}>
> {
  constructor(init: Omit<AppInitOptions<Protocol, Bun.ServerWebSocket<never>>, 'wsConnFactory'>) {
    super({
      read: init.read,
      clientWsConnFactory: (x) => x,
      logDebug: init.logDebug ?? DEBUG_MODE,
    });
  }
  static wrapWs<WSConn extends ClientWSConnection>(
    clientWsConnFactory: (ws: Bun.ServerWebSocket<{}>) => WSConn,
  ) {
    class App<Protocol extends WsMsgProtocol> extends BaseApp<Protocol, WSConn> {
      constructor(init: Omit<AppInitOptions<Protocol, never>, 'clientWsConnFactory'>) {
        super({ read: init.read, clientWsConnFactory, logDebug: init.logDebug ?? DEBUG_MODE });
      }
    }
    return App;
  }
}
