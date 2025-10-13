import { expect, test, describe } from 'bun:test';
import { HTTPRegister } from '../src/httpRegister.ts';

describe('HTTPRegister', () => {
  let httpReg = new HTTPRegister('/');
  test('addRoute', () => {
    let handler = () => new Response('404');
    expect(httpReg.addRoute('GET', handler).handlers).toEqual({ GET: handler });
    expect(httpReg.addRoute('PUT', handler).handlers).toEqual({ GET: handler, PUT: handler });
    expect(() => httpReg.addRoute('GET', handler)).toThrowError();
  });
});
