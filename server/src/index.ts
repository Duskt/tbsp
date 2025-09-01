import { Elysia, file } from "elysia";
import staticPlugin from "@elysiajs/static";

const PORT = 9001;
const CLIROOT = "../client/dist/";

const app = new Elysia()
    // serving file without the closure gives todo error?
    .get('/', () => file(`${CLIROOT}/index.html`))

    .use(staticPlugin({ assets: `${CLIROOT}/assets`, prefix: "/assets" }))
    .ws("/", {
	message(ws, message) {
            ws.send("you:"+message)
        }
    })
    .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
