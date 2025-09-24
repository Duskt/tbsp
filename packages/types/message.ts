import { User } from '@/user.ts'
type ID = number
export class Message {
  userId: ID
  body: string
  chatroomId: ID
  messageId: ID | null

  constructor(userId: ID, body: string, chatroomId: ID, messageId: ID) {
    this.userId = userId
    this.body = body
    this.chatroomId = chatroomId
    this.messageId = messageId
  }
}
