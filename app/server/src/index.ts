import { Elysia, file } from 'elysia';
import staticPlugin from '@elysiajs/static';
import sql, {
  createChatroomsTable,
  createMessageTable,
  createUserTable,
  createUsersInChatroomTable,
  createFakeData,
} from './db.ts';

createUserTable();
createChatroomsTable();
createMessageTable();
createUsersInChatroomTable();
const PORT = 9001;
const CLIROOT = '../client/dist/';
const clients = new Set<WebSocket>();
const app = new Elysia()

  .ws('/messages', {
    async message(ws, message) {
      console.log('Received:', message);

      // temporary fixes: just setting IDs to 0
      let chatRoomId = '00000000-0000-0000-0000-000000000001';
      let userId = '00000000-0000-0000-0000-000000000001';

      try {
        await sql`
    INSERT INTO messages (
      chatroomId,
      timestamp,
      userId,
      messageContent
    ) VALUES (
      ${chatRoomId},
      NOW(),
      ${userId},
      ${message}
    )
    `;
        const user = await sql`SELECT * FROM users WHERE userId = ${userId} `;
        const outgoing = JSON.stringify({ username: user[0].username, messageContent: message });
        // for now, I will just send to all clients but really should filter clients for the right chatrooms/gameIDs?
        // Or could handle client-side
        for (const client of clients) {
          if (client.readyState === 1) {
            client.send(outgoing);
          }
        }
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    },
    async open(ws) {
      console.log('Client connected');

      clients.add(ws);
      // get chatroomIds which include userId? For now we just have default

      let chatRoomId = '00000000-0000-0000-0000-000000000001';
      let messages = await sql`SELECT * FROM messages WHERE chatroomId = ${chatRoomId}`;

      // error handler does not catch errors in async code so we put in try-catch
      try {
        for (const message of messages) {
          const user = await sql`SELECT * FROM users WHERE userId = ${message.userid} `;
          const outgoing = JSON.stringify({
            username: user[0].username,
            messageContent: message.messagecontent,
          });
          ws.send(outgoing);
        }
      } catch (error) {
        console.log('error: ', error);
      }
    },
    close(ws) {
      console.log('Client disconnected');
      clients.delete(ws);
    },
  })

  // HTTP Routing is handled clientside ('Single Page Application' paradigm)
  // so we only need to provide index and assets
  .get('/*', () => file(`${CLIROOT}/index.html`))
  .use(staticPlugin({ assets: `${CLIROOT}/assets`, prefix: '/assets' }))

  // lobby connections
  .use(queueManager)
  .listen(PORT);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
