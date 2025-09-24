// given an object type T, make a new object whose
// keys are the keys of T and whose values are the values
// of T. So, the same object. But this makes TypeScript
// list them explicitly in the signature.
type Verbose<T> = {
  [K in keyof T]: T[K]
}

type RoutePath = string
