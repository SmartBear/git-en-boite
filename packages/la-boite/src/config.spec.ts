import path from 'path'
import { createConfig } from './config'
import { assertThat, hasProperty, equalTo, not, throws } from 'hamjest'

describe('createConfig', () => {
  it('throws an error if NODE_ENV is not set', () => {
    assertThat(
      () => createConfig({}),
      throws(hasProperty('message', equalTo('Please set NODE_ENV'))),
    )
  })

  context('database config', () => {
    context('when GIT_EN_BOITE_PG_URL is defined', () => {
      it('creates database config using the URL', () => {
        const config = createConfig({ NODE_ENV: 'development', GIT_EN_BOITE_PG_URL: 'test-url' })
        assertThat(config, hasProperty('database'))
        assertThat(config.database, hasProperty('url', equalTo('test-url')))
      })
    })

    context('when GIT_EN_BOITE_PG_URL is not defined', () => {
      it('defaults to a database derived from NODE_ENV', () => {
        const config = createConfig({ NODE_ENV: 'test' })
        assertThat(config, hasProperty('database'))
        assertThat(config.database, not(hasProperty('url')))
        assertThat(config.database, hasProperty('database', equalTo('git-en-boite-test')))
      })
    })
  })

  context('git config', () => {
    context('when running in development or test', () => {
      it('sets the root to ./git-repos/<environment> in the app directory', () => {
        for (const NODE_ENV of ['development', 'test']) {
          const expectedRoot = path.resolve(__dirname, '../git-repos', NODE_ENV)
          const config = createConfig({ NODE_ENV })
          assertThat(config, hasProperty('git'))
          assertThat(config.git, hasProperty('root', equalTo(expectedRoot)))
        }
      })
    })

    context('when running in any other environment', () => {
      it('sets the root to /git-repos', () => {
        const expectedRoot = '/git-repos'
        const config = createConfig({ NODE_ENV: 'staging' })
        assertThat(config, hasProperty('git'))
        assertThat(config.git, hasProperty('root', equalTo(expectedRoot)))
      })
    })
  })
})
