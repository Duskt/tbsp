import { GenericMap } from './index.ts';
import type { Register, WsMsgProtocol } from '../types.ts';

/** **WebSocketMessageRegister**
 * { 'global.queue': [anyA, anyB, anyC, ...], }
 */
export class WebSocketMessageRegister<Protocol extends WsMsgProtocol>
  extends GenericMap<{ [K in keyof Protocol]: Protocol[K][] }>
  implements Register
{
  constructor() {
    super((_) => []);
  }
  add<K extends keyof Protocol>(messageKind: K, handler: Protocol[K]): this {
    this.get(messageKind).push(handler);
    return this;
  }
  absorb(other: this) {
    this.keys().map((k) => this.get(k).concat(...other.get(k)));
  }
  match(target: string): Protocol[keyof Protocol][] | undefined {
    // TODO: match global -> global.queue OR global.whatever
    return this.get(target as any);
  }
}
