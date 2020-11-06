import { assertThat, defined, equalTo, hasProperty, matchesPattern, not, throws } from 'hamjest'
import * as winston from 'winston'

import { sanitize } from './sanitize'

describe(sanitize.name + '@wip', () => {
  it('transforms a log entry metadata field in the root', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'test',
      token: 'a-token ',
    }) as winston.Logform.TransformableInfo
    assertThat(result.token, equalTo('***'))
  })

  it('transforms several log entry metadata fields in the root', () => {
    const format = sanitize({ field: 'token' }, { field: 'password' })
    const result = format.transform({
      level: 'info',
      message: 'test',
      token: 'a-token ',
      password: 'secret',
    }) as winston.Logform.TransformableInfo
    assertThat(result.token, equalTo('***'))
    assertThat(result.password, equalTo('***'))
  })

  it('transforms fields within a deep metadata object', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'test',
      data: { payload: { token: 'a-token ' } },
    }) as winston.Logform.TransformableInfo
    assertThat(result.data.payload.token, equalTo('***'))
  })

  it('leaves info and message fields alone', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'a token',
    }) as winston.Logform.TransformableInfo
    assertThat(result.level, equalTo('info'))
    assertThat(result.message, equalTo('a token'))
  })

  it('handles meta fields with undefined values', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'a token',
      meta: undefined,
      token: 'a-token',
    }) as winston.Logform.TransformableInfo
    assertThat(result.meta, not(defined()))
    assertThat(result.token, equalTo('***'))
  })

  it('handles deep meta objects with undefined values', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'a token',
      meta: { data: undefined, token: 'a-value' },
    }) as winston.Logform.TransformableInfo
    assertThat(result.meta.data, not(defined()))
    assertThat(result.meta.token, equalTo('***'))
  })

  it('handles meta fields with null values', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'a token',
      meta: null,
      token: 'a-token',
    }) as winston.Logform.TransformableInfo
    assertThat(result.meta, equalTo(null))
    assertThat(result.token, equalTo('***'))
  })

  it('handles deep meta objects with null values', () => {
    const format = sanitize({ field: 'token' })
    const result = format.transform({
      level: 'info',
      message: 'a token',
      meta: { data: null, token: 'a-token' },
    }) as winston.Logform.TransformableInfo
    assertThat(result.meta.data, equalTo(null))
    assertThat(result.meta.token, equalTo('***'))
  })

  it('throws if a field to be sanitized is not a string', () => {
    const format = sanitize({ field: 'token' })
    assertThat(
      () =>
        format.transform({
          level: 'info',
          message: 'a token',
          token: {},
        }) as winston.Logform.TransformableInfo,
      throws(hasProperty('message', matchesPattern(/Unable to sanitize/))),
    )
  })

  it('allows custom transformation', () => {
    const format = sanitize({ field: 'header', replace: [/(before-)(.+)(-after)/, '$1***$3'] })
    const result = format.transform({
      level: 'info',
      message: 'a message',
      header: 'before-secret-after',
    }) as winston.Logform.TransformableInfo
    assertThat(result.header, equalTo('before-***-after'))
  })

  it('handles a meta object with circular references', () => {
    const meta1: any = { token: 'a-token' }
    const meta2 = { meta: meta1, token: 'a-token' }
    meta1['meta'] = meta2
    const format = sanitize({ field: 'meta' })
    assertThat(
      () =>
        format.transform({
          level: 'info',
          message: 'a message',
          meta: { meta1, meta2 },
        }) as winston.Logform.TransformableInfo,
      throws(hasProperty('message', matchesPattern(/circular/))),
    )
  })

  it('does not mutate a meta object', () => {
    const format = sanitize({ field: 'token' })
    const data = { payload: { token: 'a-token' } }
    format.transform({
      level: 'info',
      message: 'test',
      data,
    }) as winston.Logform.TransformableInfo
    assertThat(data.payload.token, equalTo('a-token'))
  })
})
