import { RedisOptions } from 'ioredis'
import path from 'path'

import { ProcessEnv } from './environment'

const appRoot = path.resolve(__dirname, '..')

export interface Config {
  git: GitOptions
  version: string
  redis: RedisOptions
}

interface GitOptions {
  root: string
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
  if (!env.REDIS_URL) throw new Error('Please set REDIS_URL')
  return env.REDIS_URL
}

export const createConfig = (env: ProcessEnv = process.env, fs = require('fs')): Config => {
  if (!env.NODE_ENV) throw new Error('Please set NODE_ENV')
  return {
    git: createGitConfig(env),
    version: createVersionConfig(env, fs),
    redis: createRedisConfig(env),
  }
}
