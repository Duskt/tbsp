import { test, describe, expect, expectTypeOf, beforeAll } from 'bun:test';
import { BaseApp } from '../src/server.ts';
import type { ServerWebSocketRegister } from '../src/types.ts';
import { SWSEventRegister } from '../src/ws/server.ts';

// An example protocol for testing.
interface WSMPing {
  kind: 'ping';
}

interface WSMPong {
  kind: 'pong';
}

type WSMessage = WSMPing | WSMPong;
type Protocol = {
  [K in WSMessage['kind']]: WSMessage & { kind: K };
};

export function write<K extends keyof Protocol>(msg: Protocol[K]): Blob {
  return new Blob([JSON.stringify(msg)]);
}

export async function read(raw: Blob): Promise<WSMessage | Error> {
  let text = await raw.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return new Error(text);
  }
}

type WSConn = Bun.ServerWebSocket<{ test: 'test' }>;

class TestServer extends BaseApp<Protocol, WSConn> {
  constructor() {
    super({ read, clientWsConnFactory: (i) => i });
  }
}

describe('custom server', () => {
  beforeAll(() => {
    test('initialise custom server', () => {
      new TestServer();
    });
  });
  test('websocket types', () => {
    let app = new TestServer();
    app.websocket('/', (ws) => {
      expectTypeOf(ws).toEqualTypeOf<ServerWebSocketRegister<Protocol, WSConn>>();
      expect(ws).toBeInstanceOf(SWSEventRegister);
      ws.onmessage('ping', (conn, msg) => {
        expectTypeOf(conn.data).toEqualTypeOf<{ test: 'test' }>();
        expectTypeOf(msg).toEqualTypeOf<WSMPing>();
        // this is called at runtime, i.e. never in these test
        // so it's not actually called.
        expect(conn).toContainKeys([
          'send',
          'close',
          'cork',
          'ping',
          'pong',
          'readyState',
          'remoteAddress',
        ]);
      });
    });
    console.log(app.wsRouter.compile());
  });
});
