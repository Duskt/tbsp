import { type RoutePath } from '../index.ts';
import WebSocketEventRegister, {
  type WebSocketCallback,
  type WebSocketEvent,
  type WebSocketHandlerMap,
} from './index.ts';
import { type WebSocketMessage, write, type WebSocketMessageMap } from './protocol.ts';

export class ClientWebSocketController extends WebSocketEventRegister<'client'> {
  ws: WebSocket;
  path: RoutePath;
  constructor(path: RoutePath) {
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
  redirect(path: RoutePath) {
    this.close();
    this.path = path;
    this.ws = new WebSocket(path);
  }
  reconnect() {
    this.redirect(this.path);
  }
}
