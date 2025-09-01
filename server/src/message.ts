import { readFileSync } from "fs";

export default class Message {
    data: DataView
    msg: string
    utf8 = new TextDecoder()
    constructor(buffer: ArrayBuffer) {
	this.data = new DataView(buffer);
	this.msg = this.utf8.decode(this.data);
	console.log(`Got message: ${this.msg}`);
    }
}

export class StrResponse {
    body: Uint8Array;
    enc = new TextEncoder();
    constructor(msg: string) {
	this.body = this.enc.encode(msg);
    }
}

export class HTMLResponse extends StrResponse {
    constructor(path: string) {
	// todo: just read file directly into arraybuffer
	super(readFileSync(path).toString());
    }
}
