import { test, describe, expect } from 'bun:test';
import { Route, RouteSegment } from '../src/route.ts';

test.each([
  '/not:allowed',
  'http://localhost:9001/test',
  '/abc /def',
  '/index/%/',
  '/**',
  '/*notin/*finalsubpath',
  '/*/*',
  '/prefix:id',
  '/*:',
  '/abc/:',
  '/:/subpath123',
  ...'!£$%^&[]{}()+',
])('%p should be invalid Route', (x) => {
  expect(() => new Route(x)).toThrowError();
});

type RouteTestCase = [string, boolean];

describe.each([
  // pathname, isLiteral
  ['/', true],
  ['/*', false],
  ['/*named', false],
  ['/:named', false],
  ['/:id/subpath123', false],
  ['/subpath1/subpath2', true],
  ['/0subpatha/:id/subpathb', false],
  ['/certain-special_characters.allowed', true],
  ['abc', true], // Routes prepend the leading /
  ['/prefix*', false],
  ['/prefix*name', false],
] as RouteTestCase[])('Route %p', (x, isLiteral) => {
  test('should be valid path', () => {
    expect(() => new Route(x)).not.toThrow();
  });
  test('isLiteral', () => {
    let r = new Route(x);
    expect(r.isLiteral()).toBe(isLiteral);
  });
});

test('subpathsOverlap', () => {
  let f = (a: string, b: string) => new RouteSegment(a).couldOverlapWith(new RouteSegment(b));
  expect(f('index.html', '*')).toBeTrue();
  expect(f('index.html', ':id')).toBeTrue();
  expect(f('index.html', 'index')).toBeFalse();
  expect(f('', '*')).toBeTrue();
  expect(f('', '')).toBeTrue();
  expect(f('v2-home', ':id')).toBeTrue();
  /* todo
  expect(f('', 'v2-*page')).toBeFalse();
  expect(f('v2-home', 'v2-*page')).toBeTrue();
  expect(f('v2', 'v2-*page')).toBeFalse();
  */
});

test.each([
  ['index.html', '*'],
  ['index.html', 'index*'],
  ['index.html', ':name'],
  ['', '*'],
])('%p should be more specific than %p', (more, less) => {
  let a = new RouteSegment(more);
  let b = new RouteSegment(less);
  expect(a.isProperSubsetOf(b)).toBeTrue();
});

test.each([
  ['*', 'hello'],
  [':id', 'hello'],
  ['index.html*', '*'],
  ['index.html*', 'index*'],
  [':id', ':name'],
])('%p should not be more specific than %p', (notMore, notLess) => {
  let a = new RouteSegment(notMore);
  let b = new RouteSegment(notLess);
  expect(a.isProperSubsetOf(b)).toBeFalse();
});
