/* tslint:disable: no-console */
import 'reflect-metadata'

import { createConnection } from 'typeorm'
import { createConfig } from './config'

const config = createConfig(process.env)

// check we can make a connection
createConnection(config.database).catch((error) => console.log(error))

console.log(`git-en-boite starting up`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

import { app } from './app'
const port = 3001
const host = 'localhost'
app.listen(port)
console.log(`Server listening on http://${host}:${port}`)
