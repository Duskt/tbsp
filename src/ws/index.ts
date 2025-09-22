import { type WSMsg, read, write } from '@/ws/protocol.ts'

type WSEvent = keyof WebSocketEventMap
type WSEventListenerTuple<K extends WSEvent> = [K, (e: WebSocketEventMap[K]) => void]

class ClientWSController {
  path: string
  ws: WebSocket
  listeners: Map<number, WSEventListenerTuple<WSEvent>>
  constructor(path: string) {
    this.path = path
    this.ws = new WebSocket(path)
    this.listeners = new Map()
  }

  /* Append a callback function to be executed upon a WebSocket event occurrence.
   * Returns a 'listenerId' which can be passed to `cancelListener`.
   * This ID is autoincremented. This callback function will be executed after any
   * previously registered listeners.
   */
  addEventListener<K extends WSEvent>(event: K, callback: (e: WebSocketEventMap[WSEvent]) => void) {
    let listenerId = Math.max(Math.max(...this.listeners.keys()), 0) + 1
    let listener: any = [event, callback] // TODO
    console.log(listener, listenerId)

    if (event === 'message') {
      listener[1] = async (e: MessageEvent<Blob>) => {
        let decodedMessage = new MessageEvent(e.type, {
          data: await read(e.data),
          origin: e.origin,
          ports: e.ports.map((v) => v),
        })
        return callback(decodedMessage)
      }
    }

    this.listeners.set(listenerId, listener)
    this.ws.addEventListener(...listener)
    return listenerId
  }

  /* Append a callback function to be executed upon receiving a message.
   * Returns a 'listenerId' which can be passed to `cancelListener`.
   * This ID is autoincremented. This callback function will be executed after any
   * previously registered listeners.
   */
  listen(callback: (e: MessageEvent<WSMsg>) => void) {
    return this.addEventListener('message', callback)
  }

  cancelListener(listenerId: number) {
    let listener = this.listeners.get(listenerId)
    if (listener === undefined) return
    this.ws.removeEventListener(...listener)
    this.listeners.delete(listenerId)
  }

  send(msg: WSMsg) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(write(msg))
    } else {
      this.addEventListener('open', () => {
        this.ws.send(write(msg))
      })
    }
  }

  redirect(path: string) {
    this.ws.close()
    this.ws = new WebSocket(path)
  }
}

const wsCon = new ClientWSController('/')
export default wsCon
