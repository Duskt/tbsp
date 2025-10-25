/** Tbsp-specific module for things used across the server and client.
 * Should be as minimal as possible (though it will still be large).
 * Most of this library (@tbsp/web) is intended to be general-purpose
 * and reusable, not just in the Tbsp app. As such, this module
 * should probably go somewhere else eventually. Or maybe I'm being
 * too strict on writing reusable implementations as a code practice.
 */

export const PROTOCOL_VERSION = 1;

interface BaseWSMessage {
  protocol_version: number;
  kind: string;
}

export interface WSJoinQueue extends BaseWSMessage {
  kind: 'global.queue';
  theme: string;
}

export interface WSChatMessage extends BaseWSMessage {
  kind: 'chat.message';
  author: string;
  msg: string;
  chatroomId: string;
}

type AnyWebSocketMessage = WSJoinQueue | WSChatMessage;
export type WebSocketMessageMap = {
  [Kind in AnyWebSocketMessage['kind']]: AnyWebSocketMessage & { kind: Kind };
};
export type TbspWsMsgProtocol = WebSocketMessageMap;

// todo: minify transmission and allow backwards compatibility (see github issue)
export function write<K extends keyof WebSocketMessageMap>(msg: WebSocketMessageMap[K]): Blob {
  return new Blob([JSON.stringify(msg)]);
}

export async function read(raw: Blob): Promise<AnyWebSocketMessage | Error> {
  console.log(raw, typeof raw);
  let text = await raw.text();
  console.log('Parsing WS message:', text);
  try {
    return JSON.parse(text);
  } catch (e) {
    return new Error(text);
  }
}
