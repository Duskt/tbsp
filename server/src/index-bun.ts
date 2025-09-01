Bun.serve({
    port: 9001,
    fetch(req, server) {
       if (server.upgrade(req)) return; 
    },
    websocket: {
	open(ws) {
	    console.log("got ws");
	},
	message(ws, message) {
	    ws.sendText("booyah");
	},
    },
    routes: {
	"/": (req) =>  new Response("hello world")
    },
});

