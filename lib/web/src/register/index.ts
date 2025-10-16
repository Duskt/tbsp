// WebSocket connections are theoretically symmetrical. However, creating one requires a(n) HTTP
// handshake (which is asymmetric), and the two are used in different environments.
// For example, the browser provides the WebSocket API, wherein the WebSocket constructor will
// send a(n) HTTP GET (upgrade) request to the URL, and thus is only for a(n) HTTP client.
// I differentiate between the two here for modularisation by using this as a generic.
export type Agent = 'client' | 'server';

/** **Register** (Abstract)
 * Just another object / dictionary / map / record...
 * Useful for type inference, method chaining and attaching mutation listeners.
 *
 * @template T An object (string indices), ideally a *mapped type*, representing the structure.
 *  E.g. `{[K in 'a' | 'b']: SomeType<K>}`
 *
 * Used to map HTTP methods to callbacks, map routes to HTTP method register, etc.
 */
export abstract class Register<T extends { [K: string]: any }> {
  handlers: Partial<T>;
  abstract cls_name: string;
  constructor() {
    this.handlers = {};
  }

  abstract merge<K extends keyof T>(handlerA: T[K], handlerB: T[K]): T[K];

  abstract match(target: string): T[keyof T][] | T[keyof T] | undefined;

  onRegistration<K extends keyof T>(_key: K, _handler: T[K]): void {}

  /** Register.**register** (a.k.a. `set`)
   * Set the value at `key` to `handler`. If this would overwrite a value, use `Register.merge` to resolve.
   */
  register<K extends keyof T>(
    key: K,
    handler: T[K],
    silent: boolean = false,
    overwrite: boolean = false,
  ) {
    let preset = this.get(key);
    if (preset !== undefined && !overwrite) {
      handler = this.merge(preset, handler);
    }
    this.handlers[key] = handler;
    if (!silent) this.onRegistration(key, handler);
    return this;
  }
  /** Alias for `Register.register`. Prefer `register`. */
  set = this.register;

  /** Register.**get**
   * Get the value indexed by `key`. This must be an exact match - to use customisable matching
   * functionality, see `Register.match`.
   */
  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.handlers[key];
  }

  keys(): (keyof T)[] {
    return Array.from(Object.keys(this.handlers));
  }

  toString() {
    let keys = Object.keys(this.handlers);
    return `<${this.cls_name} (${keys.join(', ')})>`;
  }
}
