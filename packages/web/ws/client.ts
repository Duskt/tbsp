import { RoutePath } from '../index.ts';
import { WebSocketRegister, WebSocketEvent, ClientWebSocketListener } from './index.ts';

export class ClientWebSocketController extends WebSocketRegister<'client'> {
  ws: WebSocket;
  constructor(path: RoutePath) {
    super(path);
    this.ws = new WebSocket(path);
  }
  onRegistration<K extends WebSocketEvent>(
    event: K,
    callbacks: ClientWebSocketListener<K>[],
  ): void {
    for (let c of callbacks) {
      this.ws.addEventListener(event, c);
    }
  }
}
