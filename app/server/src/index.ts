import TBSPApp from '@tbsp/web/server.ts';
import { File, PublicDirectory } from '@tbsp/web/middleware/static.ts';
import { generateRandomName } from '@tbsp/utils/randomNameGenerator.ts';
import sql, {
  createChatroomsTable,
  createMessageTable,
  createUserTable,
  createUsersInChatroomTable,
  createFakeData,
  createGameRoomTable,
  drop_tables,
  createAllTables,
} from './db.ts';
import queueManager from './queue.ts';
import { Cookie, type ServerWebSocket } from 'bun';
import { getUniqueCookie } from './cookie.ts';
import { cookieReader } from '@tbsp/web/middleware/cookie.ts';
// drop_tables();
createAllTables();
const PORT = 9001;
const CLIROOT = '../client/dist';
const clients = new Set<ServerWebSocket<{}>>();

new TBSPApp()
  // HTTP Routing is handled clientside ('Single Page Application' paradigm)
  // so we only need to provide index and assets
  .use(PublicDirectory(CLIROOT))
  .get('/*', await File(`${CLIROOT}/index.html`))
  .get('/cookie', async () => {
    let cookie = await getUniqueCookie();
    let guestName = await generateRandomName();
    console.log('First check');
    await sql`
    INSERT INTO users(
      username,
      passwordHash
    ) VALUES (
      ${guestName},
      ${'N/A'}
    )
    `;
    console.log('Second check');

    let userId = (
      await sql`
    SELECT userid FROM users WHERE username = ${guestName}
    `
    )[0];
    if (userId !== undefined) {
      console.log(userId.userid);
      await sql`
    INSERT INTO cookies(
      cookie,
      userId
    ) VALUES (
      ${cookie},
      ${userId.userid}
    )
    `;
    }

    return new Response(`hello ${guestName}`, {
      headers: { 'Set-Cookie': `id=${cookie}` },
    });
  })
  .get('/cookieread', async (request) => {
    let cookies = cookieReader(request);
    if (cookies == null) {
      return new Response(`${false}`);
    }
    let cookieList = cookies.split(';');
    for (let cookiepair of cookieList) {
      let x = cookiepair.split('=');
      if (x[0] === 'id') {
        const matches = await sql`
        SELECT cookie from cookies where cookie = ${x[1] ?? ''}
  `;
        // Here we check if we have somehow made a pre-existing cookie
        if (matches.length === 0) {
          throw Error('INVALID COOKIE');
        }
        return new Response(`${true}`);
      }
    }
    // if this return statement is not reached, then the appropriate cookie does note exist.
    return new Response(`${false}`);
  })
  .websocket('/', (ws) =>
    ws
      .onopen((ws) => console.log(`Got WS connection from ${ws.remoteAddress}`))
      .onmessage('global.queue', queueManager.addToQueue),
  )
  .websocket('/messages', (ws) => {
    ws.onmessage('chat.message', async (ws, message) => {
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
      ${message}
    )`;
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
    })
      .onopen(async (ws) => {
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
      })
      .onclose((ws) => {
        console.log('Client disconnected');
        clients.delete(ws);
      });
  })
  .start(PORT);
