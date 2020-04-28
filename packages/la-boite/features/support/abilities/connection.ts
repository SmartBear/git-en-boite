import { createConnection } from 'typeorm'
import { Before, After } from 'cucumber'
import { createConfig } from '../../../src/config'
export const config = createConfig(process.env)

Before(async function () {
  console.log('db config', config.database)
  this.connection = await createConnection(config.database)
  console.log('connection', this.connection)
})
After(async function () {
  await this.connection.dropDatabase()
  await this.connection.close()
})
