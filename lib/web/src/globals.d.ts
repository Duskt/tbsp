/*
Utility types.
*/

/** Theoretically redundant.
 * Can be used to make TS tools show the full structure of a map - sometimes...
 */
type Verbose<T> = {
  [K in keyof T]: T[K];
};

// given an enum E, return E so that the IDE (typescript LSP) will print every value
type PrintEnum<E> = { [K in keyof E]: string }; // how the hell did this work
