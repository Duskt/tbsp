import { GenericMap } from '../register/index.ts';
import { WebSocketMessageRegister } from '../register/ws.ts';
import type { RouteString } from '../route.ts';
import { type WebSocketMessage, write, type WebSocketMessageMap } from './protocol.ts';
import type { ClientWebSocketController } from '../types.ts';

export type CWSEventMap<K extends keyof WebSocketMessageMap = never> = {
  open: Event;
  close: CloseEvent;
  message: MessageEvent<WebSocketMessageMap[K]>;
  error: Event;
};

type EventListener<E> = (e: E) => void;

type _OmitMessageCWSListenerMap = {
  [K in keyof CWSEventMap as K extends 'message' ? never : K]: EventListener<CWSEventMap[K]>[];
};

type CWSListenerMap = _OmitMessageCWSListenerMap & {
  message: WebSocketMessageRegister<{
    [K in keyof WebSocketMessageMap]: EventListener<CWSEventMap<K>['message']>;
  }>;
};

export class CWSController implements ClientWebSocketController {
  ws: WebSocket;
  path: RouteString;
  messageRegister: WebSocketMessageRegister<{
    [K in keyof WebSocketMessageMap]: EventListener<CWSEventMap<K>>[];
  }>;
  otherEventListeners: GenericMap<_OmitMessageCWSListenerMap>;
  constructor(path: RouteString) {
    // let defaultFactory = (k: string) => k === 'message' ? new WebSocketMessageRegister() : [];
    // super(defaultFactory as any, "ClientWebSocketController");
    this.path = path;
    this.ws = new WebSocket(path);
    this.messageRegister = new WebSocketMessageRegister();
    this.otherEventListeners = new GenericMap((_) => []);
  }

  addEventListener<M extends keyof WebSocketMessageMap, K extends keyof CWSListenerMap>(
    event: K,
    msgKind: M,
    callback: EventListener<CWSEventMap<M>[K]>,
  ) {
    if (event === 'message') {
      this.messageRegister.get(msgKind).push(callback as any);
    } else {
      this.otherEventListeners.get(event).push(callback as any);
    }
    this.ws.addEventListener(event, callback);
  }
  add = this.addEventListener;
  onmessage<M extends keyof WebSocketMessageMap>(
    kind: M,
    callback: EventListener<CWSEventMap<M>['message']>,
  ) {
    this.addEventListener('message', kind, callback);
  }
  onopen(callback: EventListener<CWSEventMap['open']>) {
    this.addEventListener('open', null as never, callback);
  }
  onclose(callback: EventListener<CWSEventMap['close']>) {
    this.addEventListener('close', null as never, callback);
  }
  onerror(callback: EventListener<CWSEventMap['error']>) {
    this.addEventListener('error', null as never, callback);
  }

  async send<Kind extends keyof WebSocketMessageMap>(data: WebSocketMessage<Kind>) {
    this.ws.send(await write(data).arrayBuffer());
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
