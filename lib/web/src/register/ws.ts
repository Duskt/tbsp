import { Register, type Agent } from './index.ts';
import {
  read,
  type AnyWebSocketMessage,
  type WebSocketMessage,
  type WebSocketMessageMap,
} from '../ws/protocol.ts';
import RouteRegister, { type RouteMapObject } from './route.ts';
import type { RouteString } from '../route.ts';

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
  cls_name = 'WebSocketMessageRegister';
  merge<K extends keyof WebSocketMessageMap>(
    handlerA: WebSocketMessageHandlerMap<A>[K],
    handlerB: WebSocketMessageHandlerMap<A>[K],
  ): WebSocketMessageHandlerMap<A>[K] {
    return handlerA.concat(...handlerB) as WebSocketMessageHandlerMap<A>[K];
  }
  match<K extends keyof WebSocketMessageHandlerMap<A>>(
    target: K,
  ): WebSocketMessageHandlerMap<A>[K] | undefined {
    // TODO: match global -> global.queue OR global.whatever
    return this.get(target);
  }
}

export type WebSocketHandlerMap<
  A extends Agent,
  Kind extends keyof WebSocketMessageMap = keyof WebSocketMessageMap,
> = {
  [Event in WebSocketEvent]: Event extends 'message'
    ? WebSocketMessageRegister<A>[]
    : Array<WebSocketCallback<A, Event, Kind>>;
};

// Agnostic of the agent (generic client/server). Note that this does not actually cause a function
// to be executed upon any of the events happening, it is simply a register which defines their
// relationships.
export class WebSocketEventRegister<A extends Agent> extends Register<WebSocketHandlerMap<A>> {
  cls_name = 'WebSocketEventRegister';
  merge<Event extends WebSocketEvent>(
    handlerA: WebSocketHandlerMap<A>[Event],
    handlerB: typeof handlerA,
  ): typeof handlerA {
    return handlerA.concat(...handlerB) as WebSocketHandlerMap<A>[Event];
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
    return this.register('message', [wsMsgRegister]);
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
  override match<K extends WebSocketEvent>(target: K): WebSocketHandlerMap<A>[K] {
    return this.get(target) ?? [];
  }
}

export default class WebSocketRegister extends RouteRegister<WebSocketEventRegister<'server'>> {
  override cls_name = 'WebSocketRegister';

  merge<K extends RouteString>(
    a: RouteMapObject<WebSocketEventRegister<'server'>>[K],
    b: RouteMapObject<WebSocketEventRegister<'server'>>[K],
  ): RouteMapObject<WebSocketEventRegister<'server'>>[K] {
    let keys = new Set(a.keys().concat(...b.keys()));
    let blank = new WebSocketEventRegister();
    for (const k of keys) {
      for (const x of [a, b]) {
        let handler = x.get(k);
        if (handler) blank.register(k, handler);
      }
    }
    return blank;
  }

  compile(logDebug: boolean = false): Bun.WebSocketHandler<{ origin: URL }> {
    let debug = logDebug ? console.log : (..._: any) => {};
    let wsRegister = this;
    let websocket: Bun.WebSocketHandler<{ origin: URL }> = {
      async message(ws, message: Buffer<ArrayBuffer>) {
        let decodedMsg = await read(new Blob([message]));
        debug(`Got message ${message.toString()} which decoded to `, decodedMsg);
        if (decodedMsg instanceof Error) {
          console.error(
            `Couldn't decode message ${message}: possible other formats: utf8 ${message.toString('utf8')}`,
          );
          return;
        }

        let path = ws.data.origin.pathname;

        let matches = wsRegister.match(path);
        debug('Got matches', matches);
        for (const wsEventReg of matches) {
          let msgCallbacks = wsEventReg
            .match('message')
            .map((v) => v.match(decodedMsg.kind))
            .filter((v) => v !== undefined)
            .flat();
          debug('Got msgCallbacks:', msgCallbacks);
          if (msgCallbacks === undefined) continue;
          for (let f of msgCallbacks) {
            f(ws, decodedMsg as any); // TODO: no any
          }
        }
      },
      open(ws) {
        debug(`Opened WebSocket connection from ${ws.data.origin}.`);
        // TODO
      },
    };
    return websocket;
  }
}
