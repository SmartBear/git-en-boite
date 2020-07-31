import { assertThat, equalTo, hasProperty, throws, matchesPattern } from 'hamjest'

import { createConfig } from 'git-en-boite-config'

describe('createConfig', () => {
  const defaultEnv = {
    GIT_ROOT: 'some/git-root',
    NODE_ENV: 'any',
    REDIS_URL: 'redis://someredis',
  }

  it('throws an error if NODE_ENV is not set', () => {
    assertThat(
      () => createConfig({}),
      throws(hasProperty('message', equalTo('Please set NODE_ENV'))),
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
    it('raises an error if the .build-number file cannot be found', () => {
      const fakeFs = {
        existsSync: (path: string) => {
          if (path.match(/\.build-number$/)) return false
          throw new Error(`path ${path} not faked`)
        },
      }
      assertThat(
        () => createConfig({ ...defaultEnv, npm_package_version: '1.2.3' }, fakeFs),
        throws(hasProperty('message', matchesPattern('Build number file not found'))),
      )
    })

    it('returns the version from package.json with appended build number if a .build-number file exists', () => {
      const fakeFs = {
        readFileSync: (path: string) => {
          if (path.match(/\.build-number$/)) return '456'
          throw new Error(`path ${path} not faked`)
        },
        existsSync: (path: string) => {
          if (path.match(/\.build-number$/)) return true
          throw new Error(`path ${path} not faked`)
        },
      }
      const config = createConfig({ ...defaultEnv, npm_package_version: '1.2.3' }, fakeFs)
      assertThat(config, hasProperty('version', equalTo('1.2.3.456')))
    })
  })
})
