import { GenericMap } from './index.ts';
import type { Register } from '../types.ts';
import { type WebSocketMessageMap } from '../ws/protocol.ts';

/** **WebSocketMessageRegister**
 * { 'global.queue': [anyA, anyB, anyC, ...], }
 */
export class WebSocketMessageRegister<T extends { [K in keyof WebSocketMessageMap]: any }>
  extends GenericMap<{ [K in keyof T]: T[K][] }>
  implements Register
{
  constructor() {
    super((_) => [], 'WebSocketMessageRegister');
  }
  add<K extends keyof WebSocketMessageMap>(messageKind: K, handler: T[K]): this {
    this.get(messageKind).push(handler);
    return this;
  }
  absorb(other: this) {
    this.keys().map((k) => this.get(k).concat(...other.get(k)));
  }
  match(target: string): T[keyof T][] | undefined {
    // TODO: match global -> global.queue OR global.whatever
    return this.get(target as any);
  }
}
