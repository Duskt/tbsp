import { type RoutePath } from '../index.ts';
import WebSocketRegister, { type WebSocketEvent, type ClientWebSocketListener } from './index.ts';
import { type WSMsg, write } from './protocol.ts';

export class ClientWebSocketController extends WebSocketRegister<'client'> {
  ws: WebSocket;
  constructor(path: RoutePath) {
    super(path);
    this.ws = new WebSocket(path);
  }
  override onRegistration<K extends WebSocketEvent>(
    event: K,
    callbacks: ClientWebSocketListener<K>[],
  ): void {
    for (let c of callbacks) {
      this.ws.addEventListener(event, c);
    }
  }
  async send(data: WSMsg) {
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
