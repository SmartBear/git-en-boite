declare namespace hamjest {}

export interface Matcher {
  (value?: any, matcher?: Matcher): Matcher
}

export const assertThat: Matcher
export const promiseThat: Matcher
export const equalTo: Matcher
export const hasProperty: Matcher
export const not: Matcher
export const throws: Matcher
export const startsWith: Matcher
export const rejected: Matcher
export const fulfilled: Matcher

export default {}
