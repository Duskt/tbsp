import { Register } from '../../src/register/index.ts';
import { expect, describe, test, expectTypeOf } from 'bun:test';

describe('Register', () => {
  test('should be abstract', () => {
    let UnsafeRegister: any = Register;
    // @ts-expect-error
    expectTypeOf<Register<any>>().not.toBeCallableWith<any>();
    expectTypeOf(UnsafeRegister).toBeCallableWith<any>();
    expect(() => new UnsafeRegister()).toBeObject();
  });
});

type SubclassCase = {
  map: any;
  examples: Array<[string, any]>;
};

describe.each<SubclassCase>([
  { map: {}, examples: [] },
  { map: { a: 1 }, examples: [['a', 1]] },
])('Register Subclass', ({ map, examples }) => {
  class Subclass extends Register<typeof map> {
    override cls_name: string = `RegisterSubclass<${map}>`;
    override merge<K extends keyof typeof map>(
      _handlerA: (typeof map)[K],
      _handlerB: (typeof map)[K],
    ): (typeof map)[K] {
      throw new Error();
    }
    override match(_target: string) {}
  }
  test('Instantiation', () => {
    let s = new Subclass();
    expect(s.handlers).toEqual({});
    expectTypeOf(s.handlers).toEqualTypeOf<{}>();
  });
  test('Default toString display behaviour', () => {
    let s = new Subclass();
    expect(s.toString()).toStartWith(`<RegisterSubclass<${map}> (`);
    expect(`${s}`).toEqual(s.toString());
  });
});
