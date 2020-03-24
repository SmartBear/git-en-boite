/* tslint:disable: no-console */
import 'reflect-metadata'

import {createConnection} from "typeorm";
import {ClientApp} from "./entity/ClientApp";

createConnection({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "matt",
  database: "git-en-boite-development",
  entities: [__dirname + "/entity/*.ts"],
  synchronize: true,
  logging: false
})
  .then(connection => {
    // here you can start to work with your entities
  })
  .catch(error => console.log(error));


import { app } from './app'
const port = 3001
const host = "localhost"
app.listen(port)
console.log(`git-en-boite server listening on http://${host}:${port}`)
