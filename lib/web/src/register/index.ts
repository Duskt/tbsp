export class GenericMap<T extends { [K: string]: any }> {
  protected _rawMap: Partial<T>;
  readonly clsName: string;
  readonly defaultFactory: <K extends keyof T>(key: K) => T[K];
  constructor(defaultFactory: <K extends keyof T>(key: K) => T[K], clsName = 'GenericMap') {
    this.defaultFactory = defaultFactory;
    this.clsName = clsName;
    this._rawMap = {};
  }
  get shape(): typeof this._rawMap {
    return this._rawMap;
  }
  get<K extends keyof T>(key: K): T[K] {
    let v = this._rawMap[key];
    let value: T[K];
    if (v === undefined) {
      value = this.defaultFactory(key);
      this.set(key, value);
    } else {
      value = v;
    }
    return value;
  }
  set<K extends keyof T>(key: K, value: T[K]): this {
    this._rawMap[key] = value;
    return this;
  }
  keys(): (keyof T & string)[] {
    return Array.from(Object.keys(this._rawMap));
  }
  entries(): [keyof T, T[keyof T]][] {
    return Object.entries(this._rawMap);
  }
  toString() {
    return `<${this.clsName} (${this.keys().join(', ')})>`;
  }
}
