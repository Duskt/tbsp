import type { RouterTypes } from 'bun';
import { Register } from './index.ts';
import type { RouteString } from '../route.ts';
import RouteRegister, { type RouteMapObject } from './route.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library

// Passing the route path (e.g. `/home/:userid`) allows inference of the query object type!
// Uses Bun.ExtractRouteParams, a string template-matching type (so basically a macro)
export type HttpRouteHandler<P extends RouteString> = RouterTypes.RouteHandler<P>;
type HttpMethodToHandler<P extends RouteString> = { [K in HttpMethod]: HttpRouteHandler<P> };

export class HttpMethodRegister<P extends RouteString> extends Register<HttpMethodToHandler<P>> {
  path: P;
  cls_name = 'HttpMethodRegister';
  addRoute = this.register;
  constructor(path: P) {
    super();
    if (path === undefined) throw new Error();
    this.path = path;
  }

  merge(_A: HttpRouteHandler<P>, _B: HttpRouteHandler<P>): never {
    throw new Error(
      `Duplicate handlers found at HTTP path ${this.path} - this is not yet supported.`,
    );
  }

  match(target: string): HttpRouteHandler<P> | undefined {
    return this.get(target.toUpperCase() as HttpMethod);
  }

  /** Given a function `matchesSubroute`, mutate the 'GET'
   * handler to run `matchesSubroute(req)`:
   * -> true: use `subrouteHandler`
   * -> false: use original GET handler
   */
  addPrioritySubRoute(
    subrouteHandler: HttpRouteHandler<P>,
    matchesSubroute: (req: Bun.BunRequest<P>) => boolean,
  ) {
    let oldGet = this.get('GET');
    if (oldGet === undefined) {
      throw new Error('Tried to add priority subroute but the GET handler was empty.');
    }
    this.handlers['GET'] = function (req, _server) {
      console.log(
        'routing through wrapped function: matches',
        matchesSubroute,
        'to',
        subrouteHandler,
      );
      if (matchesSubroute(req)) {
        console.log('matched');
        return subrouteHandler(req, _server);
      } else {
        console.log('didnt match, resorting to', oldGet);
        return oldGet(req, _server);
      }
    };
  }
}

export default class HttpRegister extends RouteRegister<HttpMethodRegister<RouteString>> {
  override cls_name = 'HttpRegister';

  merge<K extends RouteString>(
    a: RouteMapObject<HttpMethodRegister<RouteString>>[K],
    b: RouteMapObject<HttpMethodRegister<RouteString>>[K],
  ): RouteMapObject<HttpMethodRegister<RouteString>>[K] {
    let keys = new Set(a.keys().concat(...b.keys()));
    let blank = new HttpMethodRegister(a.path);
    for (const k of keys) {
      for (const x of [a, b]) {
        let handler = x.get(k);
        if (handler !== undefined) blank.register(k, handler);
      }
    }
    return blank;
  }

  compile(): RouteMapObject<Partial<HttpMethodToHandler<RouteString>>> {
    let routes = this.keys()
      .map((k): [RouteString, Partial<HttpMethodToHandler<RouteString>>] | undefined => {
        let v = this.get(k);
        if (v === undefined) return undefined;
        return [k, v.handlers];
      })
      .filter((x) => x !== undefined);
    return Object.fromEntries(routes);
  }
}
