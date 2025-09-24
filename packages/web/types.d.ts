// given an object type T, make a new object whose
// keys are the keys of T and whose values are the values
// of T. So, the same object. But this makes TypeScript
// list them explicitly in the signature.
type Verbose<T> = {
  [K in keyof T]: T[K];
};

// given an enum E, return E so that the IDE (typescript LSP) will print every value
type PrintEnum<E> = { [K in keyof E]: string }; // how the hell did this work

// WebSocket connections are theoretically symmetrical. However, creating one requires a(n) HTTP
// handshake (which is asymmetric), and the two are used in different environments.
// For example, the browser provides the WebSocket API, wherein the WebSocket constructor will
// send a(n) HTTP GET (upgrade) request to the URL, and thus is only for a(n) HTTP client.
// I differentiate between the two here for modularisation by using this as a generic.
type Agent = 'client' | 'server';
