import Elysia from 'elysia'
import themes, { Theme } from '@/theme'

// surely there is a better way to get these types
// elysia is all abt its types so i imagine im being too primitive
type WSHandler = Parameters<Elysia['ws']>[1]['message'] & {}
type WSConn = Parameters<WSHandler>[0]

class Queue {
  theme: Theme
  waiting: WSConn[]
  constructor(theme: Theme) {
    this.theme = theme
    this.waiting = []
  }
  load(ws: WSConn, trigger: (queuers: WSConn[]) => void) {
    this.waiting.push(ws)
    if (this.waiting.length >= 2) {
      trigger(this.waiting)
    }
  }
}

class QueueManager {
  queues: Queue[]
  constructor(themes: Theme[]) {
    this.queues = themes.map((v) => new Queue(v))
  }
  getQueue(theme_id: Theme['id']) {
    return this.queues.find((v) => v.theme.id === theme_id)
  }
  addToQueue: WSHandler = (ws, msg: string) => {
    let q = this.getQueue(msg)

    // invalid theme_id
    if (q === undefined) {
      ws.send('ERR')
      return
    }
    // prevent duplicates
    if (q.waiting.map((v) => v.id).includes(ws.id)) {
      ws.send("WARN: you're already queueing")
      return
    }

    q.load(ws, (queuers) => {
      queuers.forEach((v) => {
        v.send(`You joined game ${q.theme.id}.`)
      })
    })
  }
}

export default new QueueManager(themes)
