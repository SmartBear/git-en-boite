import { createConfig } from "./config"
/* tslint:disable-next-line: no-var-requires */
const { assertThat, hasProperty, equalTo, not } = require("hamjest")

describe("createConfig", () => {
  context("database config", () => {
    context("when GIT_EN_BOITE_PG_URL is defined", () => {
      it("creates database config using the URL", () => {
        const config = createConfig({ "GIT_EN_BOITE_PG_URL": "test-url"})
        assertThat(config, hasProperty('database'))
        assertThat(config.database, hasProperty('url', equalTo('test-url')))
      })
    })

    context("when GIT_EN_BOITE_PG_URL is not defined", () => {
      it("defaults to a database derived from NODE_ENV", () => {
        const config = createConfig({ "NODE_ENV": "test"})
        assertThat(config, hasProperty('database'))
        assertThat(config.database, not(hasProperty('url')))
        assertThat(config.database, hasProperty('database', equalTo('git-en-boite-test')))
      })
    })
  })
})