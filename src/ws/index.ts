import { RouteRegister } from '@/connection';
import { WSMsg } from '@/ws/protocol';

export type WebSocketEvent = keyof Bun.WebSocketEventMap; // e.g. 'message' 'open' 'close' 'drain'

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

// WebSocket connections are theoretically symmetrical. However, creating one requires a(n) HTTP
// handshake (which is asymmetric), and the two are used in different environments.
// For example, the browser provides the WebSocket API, wherein the WebSocket constructor will
// send a(n) HTTP GET (upgrade) request to the URL, and thus is only for a(n) HTTP client.
// I differentiate between the two here for modularisation by using this as a generic.
type Agent = 'client' | 'server';
// Agnostic (generic agent)
export type WebSocketCallback<A extends Agent, K extends WebSocketEvent> = A extends 'client'
  ? ClientWebSocketListener<K>
  : TbspWebSocketHandler<K>;

// Agnostic of the agent (generic client/server). Note that this does not actually cause a function
// to be executed upon any of the events happening, it is simply a register which defines their
// relationships.
export class WebSocketRegister<A extends Agent> extends RouteRegister<
  WebSocketEvent,
  Array<WebSocketCallback<A, WebSocketEvent>>
> {
  combineHandler<K extends WebSocketEvent>(
    handlerA: WebSocketCallback<A, K>[],
    handlerB: WebSocketCallback<A, K>[],
    key: keyof Bun.WebSocketEventMap,
  ): WebSocketCallback<A, K>[] {
    return handlerA.concat(...handlerB);
  }
  addEventHandler<K extends WebSocketEvent>(event: K, callback: WebSocketCallback<A, K>) {
    return this.register(event, [callback]);
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
    for (let [event, otherCallbacks] of other.handlers.entries()) {
      let myCallbacks = this.handlers.get(event) || [];
      this.handlers.set(event, myCallbacks.concat(...otherCallbacks));
    }
  }

  match<K extends WebSocketEvent>(
    path: string,
    event: K,
    [arg1, arg2]: Parameters<WebSocketCallback<A, K>>,
  ) {
    if (this.path !== path) return;
    let handlers = this.handlers.get(event);
    if (handlers === undefined) return;
    for (let f of handlers) {
      (f as any)(arg1, arg2);
    }
  }
}

export class ClientWebSocketController extends WebSocketRegister<'client'> {
  ws: WebSocket;
  constructor(path: RoutePath) {
    super(path);
    this.ws = new WebSocket(path);
  }
  onRegistration<K extends WebSocketEvent>(event: K, callback: ClientWebSocketListener<K>[]): void {
    this.ws.addEventListener(event, callback);
  }
}
