/*

Provides validation for routes. Currently quite overengineered,
but could be useful in future for creating a central router which
can be used in client and server without duplication.
...
But our router isn't complicated at all.

A lot of methods here are unused and unnecessary, e.g.
- isProperSubsetOf
- couldOverlapWith

*/

// Conditional ESM module loading (Node.js and browser)
// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import('urlpattern-polyfill');
}

const specialChars = Array.from('*:/');
const alphanumeric = Array.from('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
const validChars = [alphanumeric, specialChars, Array.from('-_.')].flat();

export type RouteString = `/${string}`;

abstract class BaseRoute<S extends string> {
  value: S;
  constructor(value: S) {
    this.value = value;
  }
  hasRegExp() {
    return false; // Array.from('{}()').some((v) => this.path.includes(v));
  }

  isLiteral() {
    return !Array.from('*:').some((v) => this.value.includes(v));
  }

  abstract isValid(): boolean;
  abstract isExactMatchOf(other: this): boolean;
  abstract isProperSubsetOf(other: this): boolean;
  abstract couldOverlapWith(other: this): boolean;
}

export class RouteSegment extends BaseRoute<string> {
  constructor(value: string) {
    super(value);
    if (!this.isValid()) throw new Error(`Invalid RouteSegment ${value}`);
  }
  isValid(): boolean {
    let seg = this.value;
    if (seg.startsWith(':')) {
      let paramName = seg.slice(1);
      if (paramName === '') return false;
      if (paramName.includes(':')) return false;
    } else if (seg.includes(':')) {
      return false;
    }
    let astIndex = Array.from(seg).findIndex((v) => v === '*');
    if (astIndex !== -1) {
      let finalGlob = seg.slice(astIndex + 1);
      // checks / even though this is assumed...
      for (const k of specialChars) {
        if (finalGlob.includes(k)) return false;
      }
    }
    return true;
  }

  override isExactMatchOf(other: this): boolean {
    return this.value === other.value;
  }

  override isProperSubsetOf(other: RouteSegment): boolean {
    if (!this.isLiteral()) return false;
    if (other.isLiteral()) return false;
    // other matches any, so a will fit
    if (Array.from(':*').includes(other.value[0] ?? '')) return true;
    // * can also come after a prefix
    let astIndex = Array.from(other.value).findIndex((v) => v === '*');
    let prefix = other.value.slice(0, astIndex);
    if (this.value.startsWith(prefix)) return true; // assuming '' matches '*' ?
    throw new Error(`presumably invalid: ${this.value} ${other.value}`);
  }

  override couldOverlapWith(other: RouteSegment): boolean {
    let a = this.value;
    let b = other.value;
    // assumes they're both valid!
    for (const x of [a, b]) {
      if (x.startsWith(':')) {
        return true;
      } else if (x.includes(':')) {
        throw new Error(`Invalid subpath with ':' after first character: ${x}`);
      }
      if (x.startsWith('*')) {
        return true;
      } else if (x.includes('*')) {
        throw new Error(`Invalid subpath with '*' after first character: ${x}`);
      }
    }
    // only literal characters
    return a === b;
  }
}

/** **Route**
 * This class *can* use RegEx and is thus **slow**. It should not
 * be used for matching routes after the server has started listening
 * for connections.
 *
 * Currently this does not support `(){}`:
 * - Non capturing groups: `/home{/optional}`
 * - Regex patterns in paths: `/home/([A-Z]\w*)`
 */
export class Route extends BaseRoute<RouteString> {
  pattern: URLPattern;
  constructor(path: string) {
    let normPath: RouteString = path.startsWith('/') ? (path as `/${string}`) : `/${path}`;
    super(normPath);
    if (!this.isValid())
      throw new Error(
        `'${normPath}' is invalid: see Route.isValid for details. This might be a TODO.`,
      );
    this.pattern = new URLPattern({ pathname: this.value });
  }

  matchPath(path: string) {
    return this.pattern.test({ pathname: path });
  }

  override isExactMatchOf(other: this): boolean {
    return this.value === other.value;
  }

  override isProperSubsetOf(other: this): boolean {
    if (other.value === '/*') {
      if (this.isLiteral()) return true;
    }
    throw Error('todo: actually implement this');
  }

  isValid(): boolean {
    let p = this.value;
    let arrp = Array.from(p);
    for (const c of arrp) {
      if (!validChars.includes(c)) {
        return false;
      }
    }

    // * can only be present once, in the final subpath.
    let astIndex = arrp.findIndex((v) => v === '*');
    if (astIndex !== -1) {
      let finalGlob = p.slice(astIndex + 1);
      // not allowed after `*`: `:`, `/`, `*`
      for (const k of specialChars) {
        if (finalGlob.includes(k)) return false;
      }
    }

    for (const subpath of p.slice(1).split('/')) {
      if (!new RouteSegment(subpath).isValid()) return false;
    }
    return true;
  }

  couldOverlapWith(route: Route): boolean {
    // we can't test for regex overlaps
    if (this.hasRegExp() || route.hasRegExp()) {
      console.warn('Checked for a clash with a regex pattern-containing route.');
      return true;
    }
    let my = this.value.split('/');
    let your = route.value.split('/');
    let length = Math.max(my.length, your.length);
    for (let i = 0; i < length; i++) {
      let mine = my[i];
      let yours = your[i];
      if (mine === undefined || yours === undefined) return false;
      if (!new RouteSegment(mine).couldOverlapWith(new RouteSegment(yours))) return false;
    }
    return true; // they might
  }
}
