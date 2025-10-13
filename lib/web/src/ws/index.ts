import { Register } from '../index.ts';
import type { PrintEnum, Agent } from '../index.ts';
import { type WebSocketMessage, type WebSocketMessageMap } from './protocol.ts';

export type WebSocketEvent = PrintEnum<keyof Bun.WebSocketEventMap>; // e.g. 'message' 'open' 'close' 'drain'
export const WebSocketEventKeys: WebSocketEvent[] = ['open', 'close', 'message', 'error'];
export function isWebSocketEvent(k: string): k is WebSocketEvent {
  return WebSocketEventKeys.some((v) => v === k);
}
export type WebSocketEventMap<Msg> = {
  open: Event;
  close: CloseEvent;
  message: MessageEvent<Msg>;
  error: Event;
};

// Bun passes 'ws' as the first argument, which is the server's
// websocket connection object. When first initializing the connection,
// an object can be provided which becomes `ws.data`, and the type of
// this is the generic type 'Ctx' (context).
export type TbspWebSocketHandlerMap<
  Kind extends keyof WebSocketMessageMap = keyof WebSocketMessageMap,
  Ctx = {},
> = {
  message: (ws: Bun.ServerWebSocket<Ctx>, msg: WebSocketMessage<Kind>) => void;
  open: (ws: Bun.ServerWebSocket<Ctx>) => void;
  close: (ws: Bun.ServerWebSocket<Ctx>) => void;
  error: (ws: Bun.ServerWebSocket<Ctx>, err: Error) => void;
};

export type ClientWebSocketListener<
  Event extends WebSocketEvent,
  Kind extends keyof WebSocketMessageMap = keyof WebSocketMessageMap,
> = (e: WebSocketEventMap<WebSocketMessage<Kind>>[Event]) => void;

export type TbspWebSocketHandler<
  Event extends WebSocketEvent,
  Kind extends keyof WebSocketMessageMap,
> = TbspWebSocketHandlerMap<Kind>[Event];

// Agnostic (generic agent)
export type WebSocketCallback<
  A extends Agent,
  Event extends WebSocketEvent,
  Kind extends keyof WebSocketMessageMap = keyof WebSocketMessageMap,
> = A extends 'client'
  ? ClientWebSocketListener<Event, Kind>
  : A extends 'server'
    ? TbspWebSocketHandler<Event, Kind>
    : never;

export type WebSocketMessageHandlerMap<A extends Agent> = {
  [K in keyof WebSocketMessageMap]: Array<WebSocketCallback<A, 'message', K>>;
};
export class WebSocketMessageRegister<A extends Agent> extends Register<
  WebSocketMessageHandlerMap<A>
> {
  override combineHandler<K extends keyof WebSocketMessageMap>(
    handlerA: WebSocketMessageHandlerMap<A>[K],
    handlerB: WebSocketMessageHandlerMap<A>[K],
    _key: K,
  ): WebSocketMessageHandlerMap<A>[K] {
    return handlerA.concat(...handlerB) as WebSocketMessageHandlerMap<A>[K];
  }
}

export type WebSocketHandlerMap<
  A extends Agent,
  Kind extends keyof WebSocketMessageMap = keyof WebSocketMessageMap,
> = {
  [Event in WebSocketEvent]: Event extends 'message'
    ? WebSocketMessageRegister<A>
    : Array<WebSocketCallback<A, Event, Kind>>;
};

// Agnostic of the agent (generic client/server). Note that this does not actually cause a function
// to be executed upon any of the events happening, it is simply a register which defines their
// relationships.
export default class WebSocketEventRegister<A extends Agent> extends Register<
  WebSocketHandlerMap<A>
> {
  combineHandler<Event extends WebSocketEvent>(
    handlerA: WebSocketHandlerMap<A>[Event],
    handlerB: typeof handlerA,
    _: Event | undefined,
  ): WebSocketHandlerMap<A>[Event] {
    if (handlerA === undefined || handlerB === undefined) {
      return handlerA ?? handlerB;
    }
    // TODO: why is casting necessary here?
    if (Array.isArray(handlerA) && Array.isArray(handlerB)) {
      return handlerA.concat(
        ...(handlerB as Array<any> & typeof handlerB),
      ) as WebSocketHandlerMap<A>[Event];
    }
    if (
      handlerA instanceof WebSocketMessageRegister &&
      handlerB instanceof WebSocketMessageRegister
    ) {
      return handlerA.merge(handlerB) as WebSocketHandlerMap<A>[Event];
    }
    throw new Error(
      'Attempted to concatenate two arrays of WebSocket callbacks which responded to different events.',
    );
  }
  addEventHandler<Event extends Exclude<WebSocketEvent, 'message'>>(
    event: Event,
    callback: WebSocketCallback<A, Event>,
  ) {
    let callbackList = [callback] as WebSocketHandlerMap<A>[Event];
    return this.register(event, callbackList);
  }

  onmessage<Kind extends keyof WebSocketMessageMap>(
    kind: Kind,
    callback: WebSocketCallback<A, 'message', Kind>,
  ): this {
    let wsMsgRegister = new WebSocketMessageRegister<A>();
    wsMsgRegister.register(kind, [callback] as NonNullable<
      WebSocketMessageRegister<A>['handlers'][Kind]
    >);
    return this.register('message', wsMsgRegister);
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
}
