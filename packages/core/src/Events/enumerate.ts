// Utility types for creating a type-checked exhaustive list of the keys in a type at runtime
// See https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-654906323
type ValueOf<T> = T[keyof T]
type NonEmptyArray<T> = [T, ...T[]]
type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never
export const enumerate = <T>() => <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) => elements
