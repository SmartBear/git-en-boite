import { AccessDenied } from 'git-en-boite-core'
import { assertThat, equalTo, instanceOf, is } from 'hamjest'

import { GitCommandError } from './git_command_error'

describe(GitCommandError.name, () => {
  describe('parsing a GitProcess.exec result', () => {
    it('returns AccessDenied for a URL that needs authentication', () => {
      const error = GitCommandError.for(
        'ls-remote',
        ['https://smartbear/git-en-boite-test-private.git'],
        {
          exitCode: 128,
          stdout: '',
          stderr: `credential-osxkeychain' is not a git command. See 'git --help'.
error: cannot run null: No such file or directory
fatal: could not read Username for 'https://smartbear/git-en-boite-test-private.git': terminal prompts disabled`,
        },
      )
      assertThat(error, is(instanceOf(AccessDenied)))
      assertThat(error.message, equalTo('The server asked for authentication.'))
    })

    it('returns AccessDenied for a token that needs SSO enabled', () => {
      const error = GitCommandError.for(
        'ls-remote',
        ['https://a-token/smartbear/git-en-boite-test-private.git'],
        {
          exitCode: 128,
          stdout: '',
          stderr: `remote: The \`FooBar' organization has enabled or enforced SAML SSO. To access
remote: this repository, visit https://github.com/orgs/SmartBear/sso?authorization_request=AAABBBCCC
remote: and try your request again.
fatal: unable to access 'https://github.com/smartbear/git-en-boite-test-private.git/': The requested URL returned error: 403`,
        },
      )
      assertThat(error, is(instanceOf(AccessDenied)))
      assertThat(error.message, equalTo('Please enable SSO for your token.'))
    })
  })
})
