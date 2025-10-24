// Bun passes 'ws' as the first argument, which is the server's
// websocket connection object. When first initializing the connection,
// an object can be provided which becomes `ws.data`, and the type of

import { GenericMap } from '../register/index.ts';
import { GenericRouteMap } from '../register/route.ts';
import { WebSocketMessageRegister } from '../register/ws.js';
import type { RouteString } from '../route.ts';
import type { PrintEnum, Register, ServerWebSocketRegister } from '../types.ts';
import type { WebSocketMessage, WebSocketMessageMap } from './protocol.ts';
import { read } from './protocol.ts';

export type SWSEvent = PrintEnum<'drain' | keyof Bun.WebSocketEventMap>;

// this is the generic type 'Ctx' (context).
export type SWSHandlerMap<WSConn, Kind extends keyof WebSocketMessageMap = never> = {
  message: (ws: WSConn, msg: WebSocketMessage<Kind>) => void;
  open: (ws: WSConn) => void;
  close: (ws: WSConn) => void;
  error: (ws: WSConn, err: Error) => void;
  drain: any;
};

type _OmitMessageSWSHandlerMap<WSConn> = {
  [K in keyof SWSHandlerMap<WSConn> as K extends 'message' ? never : K]: SWSHandlerMap<WSConn>[K][];
};

export class SWSEventRegister<WSConn> implements ServerWebSocketRegister<WSConn> {
  messageRegister: WebSocketMessageRegister<{
    [K in keyof WebSocketMessageMap]: SWSHandlerMap<WSConn, K>['message'][];
  }>;
  otherEventListeners: GenericMap<_OmitMessageSWSHandlerMap<WSConn>>;
  constructor() {
    this.messageRegister = new WebSocketMessageRegister();
    this.otherEventListeners = new GenericMap((_) => []);
  }
  get<K extends keyof SWSHandlerMap<WSConn>, M extends keyof WebSocketMessageMap>(
    event: K,
    kind: M,
  ): SWSHandlerMap<WSConn, M>[K][] {
    if (event === 'message') {
      return this.messageRegister.get(kind);
    } else {
      return this.otherEventListeners.get(event);
    }
  }
  add<M extends keyof WebSocketMessageMap, K extends keyof SWSHandlerMap<WSConn>>(
    event: K,
    msgKind: M,
    callback: SWSHandlerMap<WSConn, M>[K],
  ) {
    this.get(event, msgKind).push(callback);
    return this;
  }
  absorb(other: this) {
    this.messageRegister.absorb(other.messageRegister);
    for (let k of other.otherEventListeners.keys()) {
      this.otherEventListeners.get(k).concat(...other.otherEventListeners.get(k));
    }
  }
  onopen(callback: SWSHandlerMap<WSConn>['open']) {
    return this.add('open', null as never, callback);
  }
  onclose(callback: SWSHandlerMap<WSConn>['close']) {
    return this.add('close', null as never, callback);
  }
  onerror(callback: SWSHandlerMap<WSConn>['error']) {
    return this.add('error', null as never, callback);
  }
  onmessage<K extends keyof WebSocketMessageMap>(
    kind: K,
    callback: SWSHandlerMap<WSConn, K>['message'],
  ) {
    return this.add('message', kind, callback);
  }
}

export class WebSocketRouter<WSConn>
  extends GenericRouteMap<{
    [K in RouteString]: SWSEventRegister<WSConn>;
  }>
  implements Register
{
  wsConnFactory: (bunws: Bun.ServerWebSocket<{}>) => WSConn;
  constructor(wsConnFactory: (bunws: Bun.ServerWebSocket<{}>) => WSConn) {
    super((_) => new SWSEventRegister(), 'WebSocketRouter');
    this.wsConnFactory = wsConnFactory;
  }
  add<
    Path extends RouteString,
    MsgKind extends keyof WebSocketMessageMap,
    Event extends keyof SWSHandlerMap<WSConn>,
  >(path: Path, event: Event, msgKind: MsgKind, callback: SWSHandlerMap<WSConn, MsgKind>[Event]) {
    this.get(path).add(event, msgKind, callback);
    return this;
  }
  absorb(other: this) {
    for (let k of other.keys()) {
      this.get(k).absorb(other.get(k));
    }
  }

  compile(logDebug: boolean = false): Bun.WebSocketHandler<{ origin: URL }> {
    let debug = logDebug ? console.log : (..._: never[]) => {};
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

        let path = ws.data.origin.pathname as `/${string}`;
        let match: SWSEventRegister<WSConn> = wsRegister.get(path);
        let conn = wsRegister.wsConnFactory(ws);
        match.get('message', decodedMsg.kind).forEach((f) => f(conn, decodedMsg));
      },
      open(ws) {
        debug(`Opened WebSocket connection from ${ws.data.origin}.`);
        // TODO
      },
    };
    return websocket;
  }
}
