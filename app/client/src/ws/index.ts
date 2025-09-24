import { WebSocketEventMap, WebSocketHandler } from 'bun';
import { type WSMsg, read, write } from '@tbsp/web/ws/protocol.ts';

export default class WSController {
  path: RoutePath;
  ws: WebSocket;
  listeners: Map<number, [WSEvent, BunWebSocketEventHandler<WSEvent>]>;
  constructor(path: string) {
    this.path = path;
    this.ws = new WebSocket(path);
    this.listeners = new Map();
  }

  /* Append a callback function to be executed upon a WebSocket event occurrence.
   * Returns a 'listenerId' which can be passed to `cancelListener`.
   * This ID is autoincremented. This callback function will be executed after any
   * previously registered listeners.
   */
  addEventListener<K extends WSEvent>(event: K, callback: TBSPWebSocketHandler<K>) {
    let listenerIds = this.listeners.size === 0 ? [0] : this.listeners.keys();
    let newId = Math.max(...listenerIds) + 1;

    let rawCallback: BunWebSocketEventHandler<K>;
    if (event === 'message') {
      rawCallback = (async (e: Bun.BunMessageEvent<Blob>) => {
        let decodedMessage: MessageEvent<WSMsg> = new MessageEvent(e.type, {
          data: await read(e.data),
          origin: e.origin,
        });
        return (callback as TBSPWebSocketHandler<'message'>)(decodedMessage);
      }) as BunWebSocketEventHandler<K>;
    } else {
      rawCallback = callback;
    }

    let listener: [K, BunWebSocketEventHandler<K>] = [event, rawCallback];
    this.listeners.set(newId, listener as any); // TODO: this better. but its rly just a type system limitation
    this.ws.addEventListener(...listener);
    return newId;
  }

  /* Append a callback function to be executed upon receiving a message.
   * Returns a 'listenerId' which can be passed to `cancelListener`.
   * This ID is autoincremented. This callback function will be executed after any
   * previously registered listeners.
   */
  listen(callback: (e: MessageEvent<WSMsg> | Error) => void) {
    return this.addEventListener('message', callback);
  }
  onmessage(callback: (e: MessageEvent<WSMsg>) => void) {
    throw new Error("To append an 'onmessage' listener, use `.listen`.");
  }

  cancelListener(listenerId: number) {
    let listener = this.listeners.get(listenerId);
    if (listener === undefined) return;
    this.ws.removeEventListener(...listener);
    this.listeners.delete(listenerId);
  }

  send(msg: WSMsg) {
    let sendMsg = async () => this.ws.send(await write(msg).arrayBuffer());
    if (this.ws.readyState === WebSocket.OPEN) {
      sendMsg(); // we don't need to await unless we need the value back synchronously-like
    } else {
      this.addEventListener('open', sendMsg);
    }
  }

  redirect(path: string) {
    this.ws.close();
    this.ws = new WebSocket(path);
  }
}
