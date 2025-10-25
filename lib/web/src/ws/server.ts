// Bun passes 'ws' as the first argument, which is the server's
// websocket connection object. When first initializing the connection,
// an object can be provided which becomes `ws.data`, and the type of

import { GenericMap } from '../register/index.ts';
import { GenericRouteMap } from '../register/route.ts';
import { WebSocketMessageRegister } from '../register/ws.js';
import type { RouteString } from '../route.ts';
import type {
  PrintEnum,
  Register,
  ServerWebSocketRegister,
  WsMsgProtocol,
  WsMsgReader,
} from '../types.ts';

export type SWSEvent = PrintEnum<'drain' | keyof Bun.WebSocketEventMap>;

export type SWSHandlerMap<
  Protocol extends WsMsgProtocol,
  WSConn,
  Kind extends keyof Protocol = never,
> = {
  message: (ws: WSConn, msg: Protocol[Kind]) => void;
  open: (ws: WSConn) => void;
  close: (ws: WSConn) => void;
  error: (ws: WSConn, err: Error) => void;
  drain: any;
};

type _OmitMessageSWSHandlerMap<Protocol extends WsMsgProtocol, WSConn> = {
  [K in keyof SWSHandlerMap<Protocol, WSConn> as K extends 'message' ? never : K]: SWSHandlerMap<
    Protocol,
    WSConn
  >[K][];
};

export class SWSEventRegister<Protocol extends WsMsgProtocol, WSConn>
  implements ServerWebSocketRegister<Protocol, WSConn>
{
  messageRegister: WebSocketMessageRegister<{
    [K in keyof Protocol]: SWSHandlerMap<Protocol, WSConn, K>['message'][];
  }>;
  otherEventListeners: GenericMap<_OmitMessageSWSHandlerMap<Protocol, WSConn>>;
  constructor() {
    this.messageRegister = new WebSocketMessageRegister();
    this.otherEventListeners = new GenericMap((_) => []);
  }
  get<K extends keyof SWSHandlerMap<Protocol, WSConn>, M extends keyof Protocol>(
    event: K,
    kind: K extends 'message' ? M : undefined,
  ): SWSHandlerMap<Protocol, WSConn, M>[K][] {
    if (event === 'message') {
      return this.messageRegister.get(kind as M);
    } else {
      return this.otherEventListeners.get(event);
    }
  }
  getEventListeners = this.get;
  add<M extends keyof Protocol, K extends keyof SWSHandlerMap<Protocol, WSConn>>(
    event: K,
    msgKind: K extends 'message' ? M : never,
    callback: SWSHandlerMap<Protocol, WSConn, M>[K],
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
  onopen(callback: SWSHandlerMap<Protocol, WSConn>['open']) {
    return this.add('open', null as never, callback);
  }
  onclose(callback: SWSHandlerMap<Protocol, WSConn>['close']) {
    return this.add('close', null as never, callback);
  }
  onerror(callback: SWSHandlerMap<Protocol, WSConn>['error']) {
    return this.add('error', null as never, callback);
  }
  onmessage<K extends keyof Protocol>(
    kind: K,
    callback: SWSHandlerMap<Protocol, WSConn, K>['message'],
  ) {
    return this.add('message', kind, callback);
  }
}

export class WebSocketRouter<Protocol extends WsMsgProtocol, WSConn>
  extends GenericRouteMap<{
    [K in RouteString]: ServerWebSocketRegister<Protocol, WSConn>;
  }>
  implements Register
{
  read: WsMsgReader<Protocol>;
  clientWsConnFactory: (bunws: Bun.ServerWebSocket<{}>) => WSConn;
  constructor(
    read: WsMsgReader<Protocol>,
    clientWsConnFactory: (bunws: Bun.ServerWebSocket<{}>) => WSConn,
  ) {
    super((_) => new SWSEventRegister());
    this.read = read;
    this.clientWsConnFactory = clientWsConnFactory;
  }
  add<
    Path extends RouteString,
    MsgKind extends keyof Protocol,
    Event extends keyof SWSHandlerMap<Protocol, WSConn>,
  >(
    path: Path,
    event: Event,
    msgKind: MsgKind,
    callback: SWSHandlerMap<Protocol, WSConn, MsgKind>[Event],
  ) {
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
        let decodedMsg = await wsRegister.read(new Blob([message]));
        debug(`Got message ${message.toString()} which decoded to `, decodedMsg);
        if (decodedMsg instanceof Error) {
          console.error(
            `Couldn't decode message ${message}: possible other formats: utf8 ${message.toString('utf8')}`,
          );
          return;
        }

        let path = ws.data.origin.pathname as `/${string}`;
        let match = wsRegister.get(path);
        let conn = wsRegister.clientWsConnFactory(ws);
        match.getEventListeners('message', decodedMsg.kind).forEach((f) => f(conn, decodedMsg));
      },
      open(ws) {
        debug(`Opened WebSocket connection from ${ws.data.origin}.`);
        // TODO
      },
    };
    return websocket;
  }
}
