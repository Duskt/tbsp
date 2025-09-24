import { RouterTypes } from 'bun';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library
export type RoutePath = string;

type RouteHandler = RouterTypes.RouteHandler<string>;

type RegisterObject<Key extends string, Handler> = {
  [K in Key]?: Handler;
};

/* Basically just a dictionary of HTTPMethods/WSEvents to handlers.
 * Set up at a specific path.
 */
export abstract class RouteRegister<Key extends string, Handler> {
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
  abstract combineHandler(handlerA: Handler, handlerB: Handler, key: Key): Handler;
  onRegistration(key: Key, handler: Handler): void {}
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
}

export class HTTPRegister extends RouteRegister<HTTPMethod, RouteHandler> {
  combineHandler(handlerA: RouteHandler, handlerB: RouteHandler, key: HTTPMethod): never {
    throw new Error(
      `Duplicate handlers found at HTTP path ${this.path} (${key}) - this is not yet supported.`,
    );
  }
  addRoute<K extends HTTPMethod>(method: K, callback: RouteHandler) {
    this.register(method, callback);
  }
}
