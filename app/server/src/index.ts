import { File, PublicDirectory } from '@tbsp/web/middleware';
import { TbspApp } from '@tbsp/web/tbsp';
import type { ServerWebSocket } from 'bun';
import sql, { runMigrations } from './db.ts';
import queueManager from './queue.ts';

// dropTables();
runMigrations();

const PORT = 9001;
const CLI_ROOT = '../client/dist';

const clients = new Set<ServerWebSocket<{}>>();

new TbspApp()
  // HTTP Routing is handled clientside ('Single Page Application' paradigm)
  // so we only need to provide index and assets
  .use(PublicDirectory(CLI_ROOT))
  .get('/*', File(`${CLI_ROOT}/index.html`))
  .websocket('/', (register) =>
    register
      .onopen((ws) => console.log(`Got WS connection from ${ws.remoteAddress}`))
      .onmessage('global.queue', queueManager.addToQueue),
  )
  .websocket('/messages', (register) => {
    register
      .onmessage('chat.message', async (ws, message) => {
        console.log('Received:', message);

        // temporary fixes: just setting IDs to 0
        let chatRoomId = '00000000-0000-0000-0000-000000000001';
        let userId = '00000000-0000-0000-0000-000000000001';

        try {
          await sql`INSERT INTO messages (
            chatroomId,
            timestamp,
            userId,
            messageContent
          ) VALUES (
            ${chatRoomId},
            NOW(),
            ${userId},
            ${message.msg}
          )`;
          const user = await sql`SELECT * FROM users WHERE userId = ${userId} limit 1;`;
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
      })
      .onopen(async (ws) => {
        console.log('Client connected');

        clients.add(ws);
        // get chatroomIds which include userId? For now we just have default

        const chatRoomId = '00000000-0000-0000-0000-000000000001';

        const messagesWithUser = await sql`
          SELECT messages.messageContent, users.username
          FROM messages
          JOIN users ON messages.userId = users.userId
          WHERE messages.chatroomId = ${chatRoomId};
        `;

        messagesWithUser.forEach((m) => {
          const outgoing = JSON.stringify({
            username: m.username,
            messageContent: m.messageContent,
          });
          ws.send(outgoing);
        });
      })
      .onclose((ws) => {
        console.log('Client disconnected');
        clients.delete(ws);
      });
  })
  .start(PORT);
