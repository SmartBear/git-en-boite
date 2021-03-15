import { AccessDenied, FileNotFound, LockedByAnotherProcess } from 'git-en-boite-core'
import { assertThat, equalTo, instanceOf, is } from 'hamjest'

import { GitCommandError } from './git_command_error'

describe(GitCommandError.name, () => {
  describe('parsing a GitProcess.exec result', () => {
    it('returns AccessDenied for a URL that needs authentication', () => {
      const error = GitCommandError.for('ls-remote', ['https://github.com/smartbear/git-en-boite-test-private.git'], {
        exitCode: 128,
        stdout: '',
        stderr: `credential-osxkeychain' is not a git command. See 'git --help'.
error: cannot run null: No such file or directory
fatal: could not read Username for 'https://github.com/smartbear/git-en-boite-test-private.git': terminal prompts disabled`,
      })
      assertThat(error, is(instanceOf(AccessDenied)))
      assertThat(error.message, equalTo('The server asked for authentication.'))
    })

    it('returns AccessDenied for a token that needs SSO enabled', () => {
      const error = GitCommandError.for(
        'ls-remote',
        ['https://a-token@github.com/smartbear/git-en-boite-test-private.git'],
        {
          exitCode: 128,
          stdout: '',
          stderr: `remote: The \`FooBar' organization has enabled or enforced SAML SSO. To access
remote: this repository, visit https://github.com/orgs/SmartBear/sso?authorization_request=AAABBBCCC
remote: and try your request again.
fatal: unable to access 'https://github.com/smartbear/git-en-boite-test-private.git/': The requested URL returned error: 403`,
        }
      )
      assertThat(error, is(instanceOf(AccessDenied)))
      assertThat(error.message, equalTo('Please enable SSO for your token.'))
    })

    it(`returns ${LockedByAnotherProcess.name} when a shallow.lock file was detected`, () => {
      const error = GitCommandError.for('fetch', ['https://github.com/smartbear/some-repo.git'], {
        exitCode: 128,
        stdout: '',
        stderr: `fatal: Unable to create '/private/var/folders/l9/95tdbmtd3_s0jh3m9hjt6sk80000gn/T/tmp-3156-sXelNHGEWjPq/7265706f2d39323266363863372d626332372d346662342d393630362d303533633931396436366636/shallow.lock': File exists.\n\nAnother git process seems to be running in this repository, e.g.\nan editor opened by 'git commit'. Please make sure all processes\nare terminated then try again. If it still fails, a git process\nmay have crashed in this repository earlier:\nremove the file manually to continue.\n`,
      })
      assertThat(error, is(instanceOf(LockedByAnotherProcess)))
    })

    it(`return ${LockedByAnotherProcess.name} when the shallow file has changed`, () => {
      const error = GitCommandError.for('fetch', ['https://github.com/smartbear/some-repo.git'], {
        exitCode: 128,
        stdout: '',
        stderr: `fatal: shallow file has changed since we read it\n`,
      })
      assertThat(error, is(instanceOf(LockedByAnotherProcess)))
    })

    it('returns FileNotFound when the file is inexisting', () => {
      const error = GitCommandError.for('show', ['abcd123:Unknown.feature'], {
        exitCode: 128,
        stdout: '',
        stderr: "fatal: path 'Unknown.feature' does not exist in 'abcd123'\n",
      })
      assertThat(error, is(instanceOf(FileNotFound)))
    })
  })
})
