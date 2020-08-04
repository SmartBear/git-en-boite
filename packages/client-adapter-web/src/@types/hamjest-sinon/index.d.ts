declare module 'hamjest-sinon'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Value = any

export class Matcher {
  constructor(fns?: {
    matches?: (Value) => boolean
    describeTo?: (Description) => void
    describeMismatch?: (Value, Description) => void
  })
  matches(actual: Value): boolean
  describeTo(description: Description): void
  describeMismatch(value: Value, description: Description): void
}

type ValueOrMatcher = Value | Matcher

export function wasCalled()
export function wasCalledWith(valueOrMatcher: ValueOrMatcher)
export function wasCalledInOrder(valueOrMatcher: ValueOrMatcher)
