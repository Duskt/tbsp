import { RouteRegister } from '../';
import { WSMsg } from './protocol';

export type WebSocketEvent = PrintEnum<keyof Bun.WebSocketEventMap>; // e.g. 'message' 'open' 'close' 'drain'
const WebSocketEventKeys: WebSocketEvent[] = ['open', 'close', 'message', 'error'];
export function isWebSocketEvent(k: string): k is WebSocketEvent {
  return WebSocketEventKeys.some((v) => v === k);
}

// Bun passes 'ws' as the first argument, which is the server's
// websocket connection object. When first initializing the connection,
// an object can be provided which becomes `ws.data`, and the type of
// this is the generic type 'Ctx' (context).
export type TbspWebSocketHandlerMap<Ctx = {}> = {
  message: (ws: Bun.ServerWebSocket<Ctx>, msg: WSMsg) => void;
  open: (ws: Bun.ServerWebSocket<Ctx>) => void;
  close: (ws: Bun.ServerWebSocket<Ctx>) => void;
  error: (ws: Bun.ServerWebSocket<Ctx>, err: Error) => void;
};

export type ClientWebSocketListener<K extends WebSocketEvent> = (
  event: Bun.WebSocketEventMap[K],
) => void;
export type TbspWebSocketHandler<K extends WebSocketEvent> = TbspWebSocketHandlerMap[K];

// Agnostic (generic agent)
export type WebSocketCallback<
  A extends Agent,
  K extends WebSocketEvent = WebSocketEvent,
> = A extends 'client'
  ? ClientWebSocketListener<K>
  : A extends 'server'
    ? TbspWebSocketHandler<K>
    : never;

// Agnostic of the agent (generic client/server). Note that this does not actually cause a function
// to be executed upon any of the events happening, it is simply a register which defines their
// relationships.
export default class WebSocketRegister<A extends Agent> extends RouteRegister<WebSocketEvent> {
  declare handlers: { [K in WebSocketEvent]?: Array<WebSocketCallback<A, K>> };
  combineHandler<K extends WebSocketEvent>(
    handlerA: WebSocketCallback<A, K>[],
    handlerB: WebSocketCallback<A, K>[],
    _: K | undefined,
  ): WebSocketCallback<A, K>[] {
    return handlerA.concat(...handlerB);
  }
  addEventHandler<K extends WebSocketEvent>(event: K, callback: WebSocketCallback<A, K>) {
    return this.register<K>(event, [callback]);
  }

  onmessage(callback: WebSocketCallback<A, 'message'>) {
    return this.addEventHandler('message', callback);
  }
  onopen(callback: WebSocketCallback<A, 'open'>) {
    return this.addEventHandler('open', callback);
  }
  onclose(callback: WebSocketCallback<A, 'close'>) {
    return this.addEventHandler('close', callback);
  }
  onerror(callback: WebSocketCallback<A, 'error'>) {
    return this.addEventHandler('error', callback);
  }

  merge(other: WebSocketRegister<A>) {
    for (let event of Object.keys(other.handlers)) {
      if (!isWebSocketEvent(event)) continue;
      this.mergeEventHandlers(event, other.handlers);
    }
  }

  /** **WebSocketRegister.mergeEventHandlers** ` `
   * Given a WebSocketEvent `event` and another WebSocketRegister `other`,
   * combine the handlers registered at `this.handlers[event]` with `other.handlers[event]`.
   *
   * Getting TypeScript to recognise this without just casting 'any' was almost impossible.
   */
  mergeEventHandlers<K extends WebSocketEvent>(
    event: K,
    other: { [K in WebSocketEvent]?: WebSocketCallback<A, K>[] },
  ) {
    (this.handlers[event] as WebSocketCallback<A, K>[]) = this.combineHandler<K>(
      this.handlers[event] || [],
      other[event] || [],
      event,
    );
  }

  match<K extends WebSocketEvent>(
    path: string,
    event: K,
    [arg1, arg2]: Parameters<WebSocketCallback<A, K>>,
  ) {
    if (this.path !== path) return;
    let handlers = this.handlers[event];
    if (handlers === undefined) return;
    for (let f of handlers) {
      (f as any)(arg1, arg2);
    }
  }
}
