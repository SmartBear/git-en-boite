import path from 'path'
import { createConfig } from './config'
import { assertThat, hasProperty, equalTo, not, throws } from 'hamjest'

describe('createConfig', () => {
  const defaultConfig = {
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
    context('when running in development or test', () => {
      it('sets the root to ./git-repos/<environment> in the app directory', () => {
        for (const NODE_ENV of ['development', 'test']) {
          const expectedRoot = path.resolve(__dirname, '../git-repos', NODE_ENV)
          const config = createConfig({ ...defaultConfig, NODE_ENV })
          assertThat(config, hasProperty('git'))
          assertThat(config.git, hasProperty('root', equalTo(expectedRoot)))
        }
      })
    })

    context('when running in any other environment', () => {
      it('sets the root to /git-repos', () => {
        const expectedRoot = '/git-repos'
        const config = createConfig({ ...defaultConfig, NODE_ENV: 'staging' })
        assertThat(config, hasProperty('git'))
        assertThat(config.git, hasProperty('root', equalTo(expectedRoot)))
      })
    })
  })

  context('version', () => {
    it('returns the version from package.json by default', () => {
      const fakeFs = {
        existsSync: (path: string) => {
          if (path.match(/\.build-number$/)) return false
          throw new Error(`path ${path} not faked`)
        },
      }
      // eslint-disable-next-line @typescript-eslint/camelcase
      const config = createConfig({ ...defaultConfig, npm_package_version: '1.2.3' }, fakeFs)
      assertThat(config, hasProperty('version', equalTo('1.2.3')))
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
      // eslint-disable-next-line @typescript-eslint/camelcase
      const config = createConfig({ ...defaultConfig, npm_package_version: '1.2.3' }, fakeFs)
      assertThat(config, hasProperty('version', equalTo('1.2.3.456')))
    })
  })
})
