import { createConnection } from 'typeorm'
import { Before, After } from 'cucumber'
import { createConfig } from '../../../src/config'
export const config = createConfig(process.env)

Before(async function () {
  this.connection = await createConnection(config.database)
})
After(async function () {
  await this.connection.dropDatabase()
  await this.connection.close()
})
