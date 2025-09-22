import Elysia, { t } from 'elysia'
import themes, { Theme } from '@/theme.ts'
import { WSMsg } from '@/wsapi/protocol.ts'
import { ElysiaWS } from 'elysia/ws'

class Queue {
  theme: Theme
  waiting: ElysiaWS[]
  constructor(theme: Theme) {
    this.theme = theme
    this.waiting = []
  }
  load(ws: ElysiaWS, trigger: (queuers: ElysiaWS[]) => void) {
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
  getQueue(themeId: string) {
    return this.queues.find((v) => themeId === `"${v.theme.id}"`)
  }
  addToQueue = (ws: ElysiaWS, msg: string) => {
    let q = this.getQueue(msg.toString())

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

const queueManager = new QueueManager(themes)
const wsQueue = new Elysia().ws('/', {
  body: t.Any(),
  transform(msg) {}
  message(ws, message) {
    console.log(ws, message)
    queueManager.addToQueue(ws, message)
  },
})

export default wsQueue
