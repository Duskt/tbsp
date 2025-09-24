import { RouterTypes } from 'bun';

export type RoutePath = string;
export type RouteHandler = any;

type RegisterObject<Key extends string, Handler> = {
  [K in Key]?: Handler;
};

/** Just a map of HTTPMethods/WSEvents to handlers alongside a given route path (e.g. '/')
 * 'Key' can be any string enum:
 * - for HTTP routes it is the HTTP methods (e.g. get, put)
 * - for WS it is the events (open, message)
 * This is agent-agnostic (i.e. it isn't built for client or server specifically).
 */
export abstract class RouteRegister<Key extends string, Handler extends RouteHandler> {
  path: string;
  handlers: Map<Key, Handler>;
  constructor(path: string) {
    this.path = path;
    this.handlers = new Map();
  }
  toObject(): RegisterObject<Key, Handler> {
    // ah yes type safety
    return Object.fromEntries(this.handlers.entries()) as Verbose<RegisterObject<Key, Handler>>;
  }
  register(key: Key, handler: Handler) {
    let regHandler = this.handlers.get(key);
    if (regHandler === undefined) {
      regHandler = handler;
    } else {
      regHandler = this.combineHandler(regHandler, handler, key);
    }
    this.handlers.set(key, regHandler);
    this.onRegistration(key, regHandler);
    return this;
  }

  // these functions can extend subclass functionality

  abstract combineHandler(handlerA: Handler, handlerB: Handler, key: Key): Handler;

  onRegistration(_key: Key, _handler: Handler): void {}
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library

// Passing the RoutePath (e.g. `/home/:userid`) allows inference of the query object type!
// Uses Bun.ExtractRouteParams, a string template-matching type (so basically a macro)
export type HTTPRouteHandler<P extends RoutePath> = RouterTypes.RouteHandler<P>;

export class HTTPRegister<P extends RoutePath> extends RouteRegister<
  HTTPMethod,
  HTTPRouteHandler<P>
> {
  declare path: P;
  combineHandler(
    _handlerA: HTTPRouteHandler<P>,
    _handlerB: HTTPRouteHandler<P>,
    key: HTTPMethod,
  ): never {
    throw new Error(
      `Duplicate handlers found at HTTP path ${this.path} (${key}) - this is not yet supported.`,
    );
  }
  addRoute<K extends HTTPMethod>(method: K, callback: HTTPRouteHandler<P>) {
    this.register(method, callback);
  }
}
