import { assertThat, equalTo, instanceOf } from 'hamjest'
import { AccessDenied, GitError, NotFound } from './git_error'

describe(GitError.name, () => {
  it('deserialises a NotFound error', () => {
    const original = new NotFound()
    const actual = GitError.deserialise(JSON.parse(JSON.stringify(original)))
    assertThat(actual, instanceOf(NotFound))
    assertThat(actual, equalTo(original))
  })

  it('deserialises an AccessDenied error', () => {
    const original = new AccessDenied()
    const actual = GitError.deserialise(JSON.parse(JSON.stringify(original)))
    assertThat(actual, instanceOf(AccessDenied))
    assertThat(actual, equalTo(original))
  })
})
