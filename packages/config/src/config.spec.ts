import { assertThat, containsString, equalTo, hasProperty, matchesPattern, throws } from 'hamjest'

import { createConfig } from './config'

describe('createConfig', () => {
  const defaultEnv = {
    GIT_ROOT: 'some/git-root',
    NODE_ENV: 'any',
    REDIS_URL: 'redis://someredis',
    npm_package_version: '1.2.3',
    build_number: '456',
    git_ref: 'abc',
  }

  it('throws an error if NODE_ENV is not set', () => {
    const badEnv = Object.assign({}, defaultEnv, { NODE_ENV: undefined })
    assertThat(
      () => createConfig(badEnv),
      throws(hasProperty('message', containsString('"NODE_ENV" is a required variable'))),
    )
  })

  context('git config', () => {
    context('when GIT_ROOT is set', () => {
      it('sets the root to GIT_ROOT', () => {
        const config = createConfig({ ...defaultEnv, GIT_ROOT: 'my/git-root' })
        assertThat(config, hasProperty('git'))
        assertThat(config.git, hasProperty('root', equalTo('my/git-root')))
      })
    })

    context('if GIT_ROOT is not set', () => {
      it('throws an error', () => {
        const env = { ...defaultEnv }
        delete env.GIT_ROOT
        assertThat(() => createConfig(env), throws())
      })
    })
  })

  context('version', () => {
    it('returns the version from package.json', () => {
      const config = createConfig(defaultEnv)
      assertThat(config, hasProperty('version', equalTo('1.2.3.456#abc')))
    })
  })
})
