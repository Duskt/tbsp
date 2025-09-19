import { Elysia, file } from "elysia";
import staticPlugin from "@elysiajs/static";
import queueManager from "@server/queue";
import postgres from 'postgres'
import { createChatroomsTable, createMessageTable, createUserTable, createUsersInChatroomTable, createFakeData} from "./db";
const sql = postgres({ 
  database:"TBSP"
 });
createUserTable()
createChatroomsTable()
createMessageTable()
createUsersInChatroomTable()
const PORT = 9001;
const CLIROOT = "../client/dist/";

const app = new Elysia()

.ws('/messages', {
   async message(ws, message) {
    
    console.log('Received:', message)

    // temporary fixes: just setting IDs to 0
    let chatRoomId = '00000000-0000-0000-0000-000000000001';
    let userId = '00000000-0000-0000-0000-000000000001';
   
    try{
    
    await sql`
    INSERT INTO messages (
      chatroomid,
      timestamp,
      userid,
      messagecontent
    ) VALUES (
      ${chatRoomId},
      NOW(),
      ${userId},
      ${message}
    )   
    `;

    let matches = await sql`SELECT * FROM messages`;
    for (const row of matches){
      console.log('Row keys:', Object.keys(row)); // See what columns you got
      console.log('Content:', row.messagecontent); // Will work only if that key exists
    }
    }catch (error){
      console.error('Failed to save message:', error);
    }

  },
  open(ws) {
    console.log('Client connected')
  },
  close(ws) {
    console.log('Client disconnected')
 
  }
})

    // HTTP Routing is handled clientside ('Single Page Application' paradigm)
    // so we only need to provide index and assets
    .get('/*', () => file(`${CLIROOT}/index.html`))
    .use(staticPlugin({ assets: `${CLIROOT}/assets`, prefix: "/assets" }))

    // lobby connections 
    .ws("/", {
	// pass to queue manager websocket handler
	message: queueManager.addToQueue,
    })
    .listen(PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
