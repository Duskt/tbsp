import { GenericMap } from '../register/index.ts';
import { WebSocketMessageRegister } from '../register/ws.ts';
import type { RouteString } from '../route.ts';
import type { ClientWebSocketController, WsMsgProtocol } from '../types.ts';

export type CWSEventMap<Protocol extends WsMsgProtocol, K extends keyof Protocol = never> = {
  open: Event;
  close: CloseEvent;
  message: MessageEvent<Protocol[K]>;
  error: Event;
};

type EventListener<E> = (e: E) => void;

type _OmitMessageCWSListenerMap = {
  [K in keyof CWSEventMap<never> as K extends 'message' ? never : K]: EventListener<
    CWSEventMap<never>[K]
  >[];
};

type CWSListenerMap<Protocol extends WsMsgProtocol> = _OmitMessageCWSListenerMap & {
  message: WebSocketMessageRegister<{
    [K in keyof Protocol]: EventListener<CWSEventMap<Protocol, K>['message']>;
  }>;
};

export class CWSController<Protocol extends WsMsgProtocol>
  implements ClientWebSocketController<Protocol>
{
  ws: WebSocket;
  path: RouteString;
  write: <K extends keyof Protocol>(msg: Protocol[K]) => Blob;
  messageRegister: WebSocketMessageRegister<{
    [K in keyof Protocol]: EventListener<CWSEventMap<Protocol, K>>[];
  }>;
  otherEventListeners: GenericMap<_OmitMessageCWSListenerMap>;
  constructor(path: RouteString, write: <K extends keyof Protocol>(msg: Protocol[K]) => Blob) {
    // let defaultFactory = (k: string) => k === 'message' ? new WebSocketMessageRegister() : [];
    // super(defaultFactory as any, "ClientWebSocketController");
    this.path = path;
    this.write = write;
    this.ws = new WebSocket(path);
    this.messageRegister = new WebSocketMessageRegister();
    this.otherEventListeners = new GenericMap((_) => []);
  }

  addEventListener<M extends keyof Protocol, K extends keyof CWSListenerMap<Protocol>>(
    event: K,
    msgKind: M,
    callback: EventListener<CWSEventMap<Protocol, M>[K]>,
  ) {
    if (event === 'message') {
      this.messageRegister.get(msgKind).push(callback as any);
    } else {
      this.otherEventListeners.get(event).push(callback as any);
    }
    this.ws.addEventListener(event, callback);
  }
  add = this.addEventListener;
  onmessage<M extends keyof Protocol>(
    kind: M,
    callback: EventListener<CWSEventMap<Protocol, M>['message']>,
  ) {
    this.addEventListener('message', kind, callback);
  }
  onopen(callback: EventListener<CWSEventMap<Protocol>['open']>) {
    this.addEventListener('open', null as never, callback);
  }
  onclose(callback: EventListener<CWSEventMap<Protocol>['close']>) {
    this.addEventListener('close', null as never, callback);
  }
  onerror(callback: EventListener<CWSEventMap<Protocol>['error']>) {
    this.addEventListener('error', null as never, callback);
  }

  async send<Kind extends keyof Protocol>(data: Protocol[Kind]) {
    this.ws.send(await this.write(data).arrayBuffer());
  }

  close() {
    this.ws.close();
  }
  redirect(path: RouteString) {
    this.close();
    this.path = path;
    this.ws = new WebSocket(path);
  }
  reconnect() {
    this.redirect(this.path);
  }
}
