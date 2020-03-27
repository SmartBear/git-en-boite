import { ConnectionOptions } from "typeorm"
import { ClientApp } from "./entity/ClientApp"
import { ProcessEnv } from "./environment"
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"

export interface Config {
  database: ConnectionOptions
}

const createDatabaseConfig = (env: ProcessEnv): ConnectionOptions => {
  const defaultOptions: PostgresConnectionOptions = {
    type: "postgres",
    url: env.GIT_EN_BOITE_PG_URL,
    entities: [ClientApp],
    synchronize: true
  }

  if (env.GIT_EN_BOITE_PG_URL)
    return { ...defaultOptions, url: env.GIT_EN_BOITE_PG_URL }

  return {
    ...defaultOptions,
    database: `git-en-boite-${env.NODE_ENV}`
  }
}

export const createConfig = (env: ProcessEnv): Config => ({
  database: createDatabaseConfig(env)
})