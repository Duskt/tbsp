import { Elysia, file } from "elysia";
import staticPlugin from "@elysiajs/static";
import queueManager from "@server/queue";

const PORT = 9001;
const CLIROOT = "../client/dist/";

const app = new Elysia()

.ws('/messages', {
  message(ws, message) {
    console.log('Received:', message)
    ws.send(`Echo: ${message}`)
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
