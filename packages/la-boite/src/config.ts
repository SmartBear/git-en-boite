import path from 'path'
import { ConnectionOptions } from 'typeorm'
import { ClientApp } from './entity/ClientApp'
import { ProcessEnv } from './environment'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

export interface Config {
  git: GitOptions
  database: ConnectionOptions
}

interface GitOptions {
  root: string
}

const createDatabaseConfig = (env: ProcessEnv): ConnectionOptions => {
  const defaultOptions: PostgresConnectionOptions = {
    type: 'postgres',
    url: env.GIT_EN_BOITE_PG_URL,
    entities: [ClientApp],
    synchronize: true,
  }

  if (env.GIT_EN_BOITE_PG_URL) return { ...defaultOptions, url: env.GIT_EN_BOITE_PG_URL }

  return {
    ...defaultOptions,
    database: `git-en-boite-${env.NODE_ENV}`,
  }
}

const createGitConfig = (env: ProcessEnv): GitOptions => {
  const root =
    env.NODE_ENV == 'development' || env.NODE_ENV == 'test'
      ? path.resolve(__dirname, '../git-repos', env.NODE_ENV)
      : '/git-repos'

  return {
    root,
  }
}

export const createConfig = (env: ProcessEnv = process.env): Config => {
  if (!env.NODE_ENV) throw new Error('Please set NODE_ENV')
  return {
    database: createDatabaseConfig(env),
    git: createGitConfig(env),
  }
}
