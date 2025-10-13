import type { RouterTypes } from 'bun';
import { Register, type RoutePath } from './index.ts';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library

// Passing the RoutePath (e.g. `/home/:userid`) allows inference of the query object type!
// Uses Bun.ExtractRouteParams, a string template-matching type (so basically a macro)
export type HTTPRouteHandler<P extends RoutePath> = RouterTypes.RouteHandler<P>;

export class HTTPRegister<P extends RoutePath> extends Register<{
  [K in HTTPMethod]: HTTPRouteHandler<P>;
}> {
  path: P;
  constructor(path: P) {
    super();
    this.path = path;
  }
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
    return this.register(method, callback);
  }
}
