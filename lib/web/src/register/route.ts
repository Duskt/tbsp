import { Register } from './index.ts';
import { Route, type RouteString } from '../route.ts';

export type RouteMapObject<ValueType> = { [K: RouteString]: ValueType };

export default abstract class RouteRegister<ValueType> extends Register<RouteMapObject<ValueType>> {
  cls_name = 'RouteRegister';
  routes: { [K: RouteString]: Route };
  constructor() {
    super();
    this.routes = {};
  }

  override onRegistration<K extends RouteString>(
    key: K,
    _handler: RouteMapObject<ValueType>[K],
  ): void {
    let route = new Route(key);
    this.routes[route.value] = route;
  }

  override get<K extends string>(key: K): ValueType | undefined {
    let route = new Route(key);
    return super.get(route.value);
  }

  matchPath(path: string): ValueType[] {
    return this.entries()
      .map(([route, v]) => (route.matchPath(path) ? v : undefined))
      .filter((v) => v !== undefined);
  }
  override match = this.matchPath;

  entries(): [Route, ValueType][] {
    return this.keys().map((k): [Route, ValueType] => {
      let route = this.routes[k];
      if (route === undefined) throw new Error('desync between routes and register');
      let v = this.get(k);
      if (v === undefined) throw new Error('impossible');
      return [route, v];
    });
  }
}
