import WSMsg, { read, write } from '@/wsapi/protocol.ts'
import { defineStore } from 'pinia'

type WSListener = (msgEv: MessageEvent<WSMsg>) => void

class ClientWSController {
  path: string
  _ws: WebSocket
  _listeners: Map<number, WSListener>
  constructor(path: string) {
    this.path = path
    this._ws = new WebSocket(path)
    this._listeners = new Map()
  }

  /* Append a callback function to be executed upon receiving a message.
   * Returns a 'listenerId' which can be passed to `cancelListener`.
   * This ID is autoincremented. This callback function will be executed after any
   * previously registered listeners.
   */
  listen(callback: WSListener): number {
    let listenerId = Math.max(...this._listeners.keys()) + 1
    this._listeners.set(listenerId, callback)
    this._ws.onmessage = async (e: MessageEvent<Blob>) => {
      let decodedMsgEvent = new MessageEvent(e.type, {
        data: await read(e.data),
        origin: e.origin,
        ports: e.ports.map((v) => v),
      })
      this._listeners.forEach((callback) => callback(decodedMsgEvent))
    }
    return listenerId
  }
  onmessage = this.listen

  cancelListener(listenerId: number) {
    this._listeners.delete(listenerId)
  }

  send(msg: WSMsg) {
    this._ws.send(write(msg))
  }

  redirect(path: string) {
    this._ws.close()
    this._ws = new WebSocket(path)
  }
}

export const useWsStore = defineStore('ws', () => {
  let ws = new ClientWSController('/')
  return ws
})
