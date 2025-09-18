function read(raw: Blob) {
    return raw.text();
}

function write({ msg }: { msg: string }) {
    return new Blob([msg]);
}

`
const protocol = 1;

interface Data {
    protocol_version: number;
    kind: "chat" | "action";
    msg: string;
}

async function read(raw: Blob): Promise<Data> {
    let u8arr = await raw.bytes();
    let ver = u8arr.slice(0, 4);
    let obj = u8arr.slice(4);
    return { 
	protocol_version: ver,
	kind,
	msg
    }
}

function write(
    kind: Data["kind"],
    msg: Data["msg"],
    ver: number = protocol,
): Blob {
    let blob = new Blob([to32Bit(ver), {kind, msg}]);
    return blob;
}

read(write("chat", "hello")).then((v) => {
    if (v.msg === "hello") {
	console.log('success')
    } else {
	console.log('failure')
    } 
});
`
