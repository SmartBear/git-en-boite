declare module hamjest {}

export interface Matcher {
  (value: any, matcher?: Matcher): Matcher
}

export const assertThat: Matcher
export const equalTo: Matcher
export const hasProperty: Matcher
export const not: Matcher

export default {}
