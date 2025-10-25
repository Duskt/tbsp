import type { HttpMethod, HttpRouteHandler } from './register/http.ts';
import type { GenericRouteMap } from './register/route.ts';
import type { RouteString } from './route.ts';

export interface Register {
  add(...args: any[]): this;
  absorb(other: this): void;
}

export type WsMsgProtocol = { [K: string]: object };
export type WsMsgReader<Protocol extends WsMsgProtocol> = (
  data: Blob,
) => Promise<(Protocol[keyof Protocol] & { kind: keyof Protocol }) | Error>;

export interface ClientWebSocketController<Protocol extends WsMsgProtocol> {
  ws: WebSocket;
  path: RouteString;
  onmessage<K extends keyof Protocol>(
    kind: K,
    listener: (e: MessageEvent<Protocol[K]>) => void,
  ): void;
  onopen(listener: (e: Event) => void): void;
  onclose(listener: (e: CloseEvent) => void): void;
  onerror(listener: (e: unknown) => void): void;
  send<K extends keyof Protocol>(msg: Protocol[K]): void;
  close(): void;
}

export interface ServerWebSocketRegister<Protocol extends WsMsgProtocol, WSConn> extends Register {
  onopen(callback: (ws: WSConn) => void): this;
  onclose(callback: (ws: WSConn) => void): this;
  onerror(callback: (ws: WSConn) => void): this;
  onmessage<K extends keyof Protocol>(
    kind: K,
    callback: (ws: WSConn, msg: Protocol[K]) => void,
  ): this;
}

export type Router<T extends { [R: RouteString]: any }> = Register & GenericRouteMap<T>;

export interface App<Protocol extends WsMsgProtocol, WSConn> {
  route<M extends HttpMethod, P extends RouteString>(
    method: M,
    path: P,
    handler: HttpRouteHandler<P>,
  ): this;
  get<P extends RouteString>(path: P, handler: HttpRouteHandler<P>): this;
  post<P extends RouteString>(path: P, handler: HttpRouteHandler<P>): this;
  put<P extends RouteString>(path: P, handler: HttpRouteHandler<P>): this;
  delete<P extends RouteString>(path: P, handler: HttpRouteHandler<P>): this;
  use(plugin: this): this;
  websocket<P extends RouteString>(
    path: P,
    wsCallback: (ws: ServerWebSocketRegister<Protocol, WSConn>) => void,
  ): this;
  start(port: number): void;
}
/*
Utility types.
*/
// given an enum E, return E so that the IDE (typescript LSP) will print every value
export type PrintEnum<E> = { [K in keyof E]: string }; // how the hell did this work
