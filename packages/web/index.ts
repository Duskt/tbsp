import { RouterTypes } from 'bun';

export type RoutePath = string;
export type RouteHandler = any;

export type Register<Key extends string> = {
  [K in Key]?: RouteHandler;
};

/** Just a map of HTTPMethods/WSEvents to handlers alongside a given route path (e.g. '/')
 * 'Key' can be any string enum:
 * - for HTTP routes it is the HTTP methods (e.g. get, put)
 * - for WS it is the events (open, message)
 * This is agent-agnostic (i.e. it isn't built for client or server specifically).
 */
export abstract class RouteRegister<Key extends string> {
  path: string;
  handlers: Register<Key>;
  constructor(path: string) {
    this.path = path;
    this.handlers = {};
  }
  register<K extends Key>(key: K, handler: Register<Key>[K]) {
    let preset = this.handlers[key];
    if (preset !== undefined) {
      handler = this.combineHandler(preset, handler, key);
    }
    this.handlers[key] = handler;
    this.onRegistration(key, handler);
    return this;
  }

  // these functions can extend subclass functionality

  abstract combineHandler<K extends Key>(
    handlerA: Register<Key>[K],
    handlerB: Register<Key>[K],
    key: K,
  ): Register<Key>[K];

  onRegistration<K extends Key>(_key: K, _handler: Register<Key>[K]): void {}
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library

// Passing the RoutePath (e.g. `/home/:userid`) allows inference of the query object type!
// Uses Bun.ExtractRouteParams, a string template-matching type (so basically a macro)
export type HTTPRouteHandler<P extends RoutePath> = RouterTypes.RouteHandler<P>;

export class HTTPRegister<P extends RoutePath> extends RouteRegister<HTTPMethod> {
  declare path: P;
  combineHandler(
    _handlerA: HTTPRouteHandler<P>,
    _handlerB: HTTPRouteHandler<P>,
    key: HTTPMethod | undefined,
  ): never {
    throw new Error(
      `Duplicate handlers found at HTTP path ${this.path} (${key}) - this is not yet supported.`,
    );
  }
  addRoute<K extends HTTPMethod>(method: K, callback: HTTPRouteHandler<P>) {
    this.register(method, callback);
  }
}
