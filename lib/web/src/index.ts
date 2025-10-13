// given an object type T, make a new object whose
// keys are the keys of T and whose values are the values
// of T. So, the same object. But this makes TypeScript
// list them explicitly in the signature.
export type Verbose<T> = {
  [K in keyof T]: T[K];
};

// given an enum E, return E so that the IDE (typescript LSP) will print every value
export type PrintEnum<E> = { [K in keyof E]: string }; // how the hell did this work

// WebSocket connections are theoretically symmetrical. However, creating one requires a(n) HTTP
// handshake (which is asymmetric), and the two are used in different environments.
// For example, the browser provides the WebSocket API, wherein the WebSocket constructor will
// send a(n) HTTP GET (upgrade) request to the URL, and thus is only for a(n) HTTP client.
// I differentiate between the two here for modularisation by using this as a generic.
export type Agent = 'client' | 'server';

export type RoutePath = string;
export type Handler = any;

/** Just a map of HTTPMethods/WSEvents to handlers alongside a given route path (e.g. '/')
 * 'Key' can be any string enum:
 * - for HTTP routes it is the HTTP methods (e.g. get, put)
 * - for WS it is the events (open, message)
 * This is agent-agnostic (i.e. it isn't built for client or server specifically).
 */
export abstract class Register<T extends object> {
  handlers: Partial<T>;
  cls_name: string = 'Register';
  constructor() {
    this.handlers = {};
  }

  abstract combineHandler<K extends keyof T>(handlerA: T[K], handlerB: T[K], _key: K): T[K];

  onRegistration<K extends keyof T>(_key: K, _handler: T[K]): void {}

  register<K extends keyof T>(key: K, handler: T[K]) {
    let preset = this.handlers[key];
    if (preset != undefined) {
      handler = this.combineHandler(preset, handler, key);
    }
    this.handlers[key] = handler;
    this.onRegistration(key, handler);
    return this;
  }

  display() {
    let keys = Object.keys(this.handlers);
    return `<${this.cls_name} (${keys.join(', ')})>`;
  }
  toString = this.display;

  merge(other: this) {
    let keys = new Set(Object.keys(this.handlers).concat(...Object.keys(other.handlers))) as Set<
      keyof T
    >;
    for (const k of keys) {
      let myValue = this.handlers[k];
      let otherValue = other.handlers[k];
      if (myValue === undefined) {
        this.handlers[k] = otherValue;
      } else if (otherValue === undefined) {
        continue;
      } else {
        this.combineHandler(myValue, otherValue, k);
      }
    }
    return this;
  }
}
