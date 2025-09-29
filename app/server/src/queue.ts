import { ClientWebSocketController } from '@tbsp/web/ws/client.ts';
import themes, { Theme } from '@tbsp/mafia/theme.ts';
import { type WSMsg } from '@tbsp/web/ws/protocol.ts';
import type { ServerWebSocket } from 'bun';

type WS = ServerWebSocket<{}>;

class Queue {
  theme: Theme;
  waiting: WS[];
  constructor(theme: Theme) {
    this.theme = theme;
    this.waiting = [];
  }
  load(ws: WS, trigger: (queuers: WS[]) => void) {
    this.waiting.push(ws);
    if (this.waiting.length >= 2) {
      trigger(this.waiting);
    }
  }
}

class QueueManager {
  queues: Queue[];
  constructor(themes: Theme[]) {
    this.queues = themes.map((v) => new Queue(v));
  }
  getQueue(themeId: string) {
    return this.queues.find((v) => themeId === v.theme.id);
  }
  addToQueue = (ws: WS, msg: WSMsg) => {
    if (msg.kind !== 'queue') {
      return;
    }
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

const queueManager = new QueueManager(themes);
export default queueManager;
