import { GenericMap } from './index.ts';
import { Route, type RouteString } from '../route.ts';

/** RouteRegister<T>
 * T is literally anything, the value which a route (as a key) corresponds to.
 */
export abstract class GenericRouteMap<T extends { [K: RouteString]: any }> extends GenericMap<T> {
  routes: { [K: RouteString]: Route };

  constructor(defaultFactory: <K extends keyof T>(key: K) => T[K], clsName = 'RouteRegister') {
    super(defaultFactory, clsName);
    this.routes = {};
  }

  override get<K extends keyof T>(key: K & string): T[K] {
    // validates the route immediately
    let route = new Route(key);
    return super.get(route.value) ?? this.defaultFactory(key);
    // interesting: how to make sense of the error below seeing as the above works?
    // return super.get(route.value);
  }

  override set<K extends keyof T>(key: K & string, value: T[K]): this {
    let route = new Route(key);
    this.routes[route.value] = route;
    return super.set(key, value);
  }

  override keys(): RouteString[] {
    return Object.values(this.routes).map((r) => r.value);
  }

  routeEntries(): [Route, T[keyof T]][] {
    return this.keys().map((k): [Route, T[keyof T]] => {
      let route = this.routes[k];
      if (route === undefined) {
        route = new Route(k);
        this.routes[k] = route;
      }
      let v = this.get(k);
      return [route, v];
    });
  }

  match<K extends keyof T>(path: K & string): T[K] {
    return this.routeEntries()
      .map(([route, v]) => (route.matchPath(path) ? v : undefined))
      .filter((v) => v !== undefined) as T[K];
  }
}
