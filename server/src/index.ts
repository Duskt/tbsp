import { Elysia, file } from "elysia";
import staticPlugin from "@elysiajs/static";
import queueManager from "./queue";

const PORT = 9001;
const CLIROOT = "../client/dist/";

const app = new Elysia()
    // serving file without the closure gives todo error?
    .get('/', () => file(`${CLIROOT}/index.html`))

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
