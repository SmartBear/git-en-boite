import { assertThat, equalTo, instanceOf } from 'hamjest'

import { AccessDenied, GitError, InvalidRepoUrl } from './git_error'

describe(GitError.name + '@wip', () => {
  it('serializes an InvalidRepoUrl', () => {
    const original = new InvalidRepoUrl('nope')
    const serialized = original.asSerializedError()
    const envelope = JSON.parse(serialized.message)
    assertThat(envelope.props.message, equalTo('nope'))
  })

  it('deserialises a InvalidRepoUrl error', () => {
    const original = new InvalidRepoUrl('nope')
    const actual = GitError.deserialise(original.asSerializedError())
    assertThat(actual, instanceOf(InvalidRepoUrl))
    assertThat(actual, equalTo(original))
  })

  it('deserialises an AccessDenied error', () => {
    const original = new AccessDenied()
    const actual = GitError.deserialise(original.asSerializedError())
    assertThat(actual, instanceOf(AccessDenied))
    assertThat(actual, equalTo(original))
  })
})
