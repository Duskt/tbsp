import { expect, test, describe, expectTypeOf } from 'bun:test';
import {
  isWebSocketEvent,
  type WebSocketEvent,
  WebSocketEventKeys,
  type WebSocketEventMap,
  type TbspWebSocketHandlerMap,
} from '../../src/register/ws.ts';

describe('Types', () => {
  test('WebSocketEventKeys', () => {
    // WebSocketEvent should be a string literal enum.
    expectTypeOf<WebSocketEvent>().toExtend<string>();
    // this is kind of a useless and trivial test but i want to know if the spec changes
    expectTypeOf<WebSocketEvent>().toEqualTypeOf<'open' | 'close' | 'message' | 'error'>();

    // The WebSocketEventMaps should have WebSocketEvent as keys.
    expectTypeOf<keyof WebSocketEventMap<any>>().toEqualTypeOf<WebSocketEvent>();
    expectTypeOf<keyof TbspWebSocketHandlerMap>().toEqualTypeOf<WebSocketEvent>();
  });
});

test('isWebSocketEvent', () => {
  for (const i of WebSocketEventKeys) {
    expect(isWebSocketEvent(i)).toBeTrue();
  }
  expect(isWebSocketEvent('abc')).toBeFalse();
  expect(isWebSocketEvent('OpeN')).toBeFalse();
});

describe.todo('WebSocketMessageRegister', () => {});
