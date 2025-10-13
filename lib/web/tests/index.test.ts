import { Register } from '../src/index.ts';
import { expect, describe, test, expectTypeOf } from 'bun:test';

describe('Register', () => {
  test('Is abstract', () => {
    // @ts-expect-error
    expectTypeOf<Register<any>>().not.toBeCallableWith<any>();
    let UnsafeRegister: any = Register;
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
])('Register Subclass with %p', ({ map, examples }) => {
  class Subclass extends Register<typeof map> {
    override cls_name: string = `RegisterSubclass<${map}>`;
    override combineHandler<K extends keyof typeof map>(
      _handlerA: (typeof map)[K],
      _handlerB: (typeof map)[K],
      _key: K,
    ): (typeof map)[K] {
      throw new Error();
    }
  }
  test('Instantiation', () => {
    let s = new Subclass();
    expect(s.handlers).toEqual({});
    expectTypeOf(s.handlers).toEqualTypeOf<{}>();
  });
  test('Default toString display behaviour', () => {
    let s = new Subclass();
    expect(s.display()).toStartWith(`<RegisterSubclass<${map}> (`);
    expect(`${s}`).toEqual(s.display());
  });

  test.each(examples)('merge', () => {
    let s1 = new Subclass();
    let s2 = new Subclass();
    let s = s1.merge(s2);
    expect(s).toEqual(s1);
    expect(s).toEqual(s2);
    console.log('TODO: test merge with examples registered');
  });
});
