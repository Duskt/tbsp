const protocolVer = 1

interface BaseWSMessage {
  protocol_version: number
  kind: string
}

export interface WSChatMessage extends BaseWSMessage {
  kind: 'chat'
  author: string
  msg: string
  chatroomId: string
}

type WSMsg = WSChatMessage
export default WSMsg

// todo: use elysia's end to end type safety
export async function read(raw: Blob): Promise<WSMsg> {
  return JSON.parse(await raw.text())
}

// todo: minify transmission and allow backwards compatibility (see github issue)
export function write(msg: WSMsg) {
  return new Blob([JSON.stringify(msg)])
}
