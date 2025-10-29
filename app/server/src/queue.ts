import { type Theme, defaultThemes } from '@tbsp/mafia/theme.ts';
import type { WebSocketMessageMap } from '@tbsp/web/tbsp';
import type { ServerWebSocket } from 'bun';

class Queue<WSConn> {
  theme: Theme;
  waiting: WSConn[];
  constructor(theme: Theme) {
    this.theme = theme;
    this.waiting = [];
  }
  load(ws: WSConn, trigger: (queuers: WSConn[]) => void) {
    this.waiting.push(ws);
    if (this.waiting.length >= 2) {
      trigger(this.waiting);
    }
  }
}

class QueueManager {
  queues: Queue<ServerWebSocket<{}>>[];
  constructor(themes: Theme[]) {
    this.queues = themes.map((v) => new Queue(v));
  }
  getQueue(themeId: string) {
    return this.queues.find((v) => themeId === v.theme.id);
  }
  addToQueue = (ws: ServerWebSocket<{}>, msg: WebSocketMessageMap['global.queue']) => {
    let q = this.getQueue(msg.theme);

    // invalid theme_id
    if (q === undefined) {
      ws.send('ERR');
      return;
    }
    // prevent duplicates TODO: not by IP
    if (q.waiting.map((v) => v.remoteAddress).includes(ws.remoteAddress)) {
      ws.send("WARN: you're already queueing");
      return;
    }

    q.load(ws, (queuers) => {
      queuers.forEach((v) => {
        v.send(`You joined game ${q.theme.id}.`);
      });
    });
  };
}

const queueManager = new QueueManager(defaultThemes);

export default queueManager;
