const protocolVer = 1;

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
export type WebSocketMessage<K extends keyof WebSocketMessageMap> = WebSocketMessageMap[K];

export async function read(raw: Blob): Promise<WebSocketMessage<any> | Error> {
  console.log(raw, typeof raw);
  let text = await raw.text();
  console.log('Parsing WS message:', text);
  try {
    return JSON.parse(text);
  } catch (e) {
    return new Error(text);
  }
}

// todo: minify transmission and allow backwards compatibility (see github issue)
export function write<K extends keyof WebSocketMessageMap>(msg: WebSocketMessage<K>) {
  return new Blob([JSON.stringify(msg)]);
}
