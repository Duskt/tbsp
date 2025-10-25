import { GenericMap } from './index.ts';
import { GenericRouteMap } from './route.ts';
import type { RouterTypes } from 'bun';
import type { RouteString } from '../route.ts';
import type { Register } from '../types.ts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'; // I might be missing an API type library

// Passing the route path (e.g. `/home/:userid`) allows inference of the query object type!
// Uses Bun.ExtractRouteParams, a string template-matching type (so basically a macro)
export type HttpRouteHandler<P extends RouteString> = RouterTypes.RouteHandler<P>;

export class HttpMethodHandlerMap<P extends RouteString> extends GenericMap<{
  [K in HttpMethod]?: HttpRouteHandler<P>;
}> {
  path: P;
  constructor(path: P) {
    super((_) => undefined, 'HttpMethodRegister');
    this.path = path;
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
    this.set('GET', function (req, _server) {
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
    });
    return this;
  }
}

export class HttpRouter
  extends GenericRouteMap<{
    [K: RouteString]: HttpMethodHandlerMap<RouteString>;
  }>
  implements Register
{
  constructor() {
    super((k) => new HttpMethodHandlerMap(k), 'HttpRouter');
  }
  route<P extends RouteString, M extends HttpMethod>(
    path: P,
    method: M,
    handler: HttpRouteHandler<P>,
  ) {
    let v = this.get(path);
    if (v.get(method) !== undefined) {
      throw new Error('');
    }
    v.set(method, handler);
    return this;
  }
  add = this.route;
  absorb(other: this) {
    for (let path of other.keys()) {
      let otherMethodRegister = other.get(path);
      for (let method of otherMethodRegister.keys()) {
        let handler = otherMethodRegister.get(method);
        if (handler === undefined) continue;
        this.route(path, method, handler);
      }
    }
  }
  compile() {
    return Object.fromEntries(
      this.routeEntries().map(
        ([r, reg]): readonly [RouteString, { [K in HttpMethod]?: HttpRouteHandler<any> }] => [
          r.value,
          Object.fromEntries(reg.entries()),
        ],
      ),
    );
  }
}
