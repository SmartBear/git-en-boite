import path from 'path'
import { ConnectionOptions } from 'typeorm'
import { ClientApp } from './entity/ClientApp'
import { ProcessEnv } from './environment'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

const appRoot = path.resolve(__dirname, '..')

export interface Config {
  git: GitOptions
  database: ConnectionOptions
  version: string
  redis: RedisOptions
}

interface GitOptions {
  root: string
}

interface RedisOptions {
  url: string
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
      ? path.resolve(appRoot, 'git-repos', env.NODE_ENV)
      : '/git-repos'

  return {
    root,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVersionConfig = (env: ProcessEnv, fs: any): string => {
  const buildNumPath = path.resolve(appRoot, '.build-number')
  if (fs.existsSync(buildNumPath))
    return `${env.npm_package_version}.${fs.readFileSync(buildNumPath)}`
  return env.npm_package_version
}

const createRedisConfig = (env: ProcessEnv): RedisOptions => {
  if(!env.REDIS_URL) throw new Error('Please set REDIS_URL')
  return {
    url: env.REDIS_URL,
  }
}

export const createConfig = (env: ProcessEnv = process.env, fs = require('fs')): Config => {
  if (!env.NODE_ENV) throw new Error('Please set NODE_ENV')
  return {
    database: createDatabaseConfig(env),
    git: createGitConfig(env),
    version: createVersionConfig(env, fs),
    redis: createRedisConfig(env),
  }
}
