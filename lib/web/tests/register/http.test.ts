import { expect, test, describe } from 'bun:test';
import HttpRegister, { HttpMethodRegister } from '../../src/register/http.ts';

describe('HttpMethodRegister', () => {
  test('addRoute', () => {
    let mr = new HttpMethodRegister('/');
    let handler = () => new Response('404');
    expect(mr.addRoute('GET', handler).handlers).toEqual({ GET: handler });
    expect(mr.addRoute('PUT', handler).handlers).toEqual({ GET: handler, PUT: handler });
    expect(() => mr.addRoute('GET', handler)).toThrowError();
  });
  test('match', () => {
    let mr = new HttpMethodRegister('/');
    let handler = () => new Response('404');
    mr.addRoute('GET', handler);
    expect(mr.match('GET')).toBe(handler);
    expect(mr.match('get')).toBe(handler);
    expect(mr.match('axb')).toBeUndefined();
  });
});

describe('HttpRegister', () => {
  test('merge', () => {
    let handler = () => new Response('404');
    let mr1 = new HttpMethodRegister('/').register('GET', handler);
    let hr1 = new HttpRegister().register('/', mr1);
    let mr2 = new HttpMethodRegister('/index.html').register('GET', handler);
    let hr2 = new HttpRegister().register('/index.html', mr2);
    // TODO
  });
  test('compile', () => {});
});
