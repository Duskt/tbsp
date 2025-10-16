import type { RouteString } from './route.ts';
import {
  WebSocketEventRegister,
  type WebSocketCallback,
  type WebSocketEvent,
  type WebSocketHandlerMap,
} from './register/ws.ts';
import { type WebSocketMessage, write, type WebSocketMessageMap } from './ws/protocol.ts';

export class ClientWebSocketController extends WebSocketEventRegister<'client'> {
  ws: WebSocket;
  path: RouteString;
  constructor(path: RouteString) {
    super();
    this.path = path;
    this.ws = new WebSocket(path);
  }

  override onRegistration<K extends WebSocketEvent>(
    _key: K,
    _handler: WebSocketHandlerMap<'client', keyof WebSocketMessageMap>[K],
  ): void {
    if (_key === 'message') {
      return;
    }
    for (const c of _handler as Array<WebSocketCallback<'client', typeof _key>>) {
      this.ws.addEventListener(_key, c);
    }
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
