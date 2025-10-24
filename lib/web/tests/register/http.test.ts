import { expect, test, describe } from 'bun:test';
import { HttpMethodHandlerMap, HttpRouter } from '../../src/register/http.ts';

describe('HttpMethodRegister', () => {
  test('addRoute', () => {
    let mr = new HttpMethodHandlerMap('/');
    let handler = () => new Response('404');
    expect(mr.set('GET', handler)['_rawMap']).toEqual({ GET: handler });
    expect(mr.set('PUT', handler)['_rawMap']).toEqual({ GET: handler, PUT: handler });
    // no, overwrites: expect(() => mr.set('GET', handler)).toThrowError();
  });
});

describe('HttpRouter', () => {
  test('route', () => {
    let router = new HttpRouter();
    router
      .route('/', 'GET', () => new Response('GET to /'))
      .route('/', 'POST', () => new Response('POST to /'))
      .route('/abc', 'GET', () => new Response('GET to /abc'));
    expect(router.keys()).toEqual(['/', '/abc']);
    expect(router.get('/').keys()).toEqual(['GET', 'POST']);
    expect(router.get('/abc').keys()).toEqual(['GET']);
    expect(router.get('/never').keys()).toEqual([]);
  });
  test('compile', () => {});
});
