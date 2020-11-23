import path from 'path'
import * as getEnv from 'env-var'

const appRoot = path.resolve(__dirname, '../../..')

export interface Config {
  git: GitOptions
  version: string
  redis: string
  logger: LoggerOptions
}

interface GitOptions {
  root: string
  queueName: string
}

export type LoggerOptions = {
  readableBy: 'humans' | 'machines' | 'nobody'
}

const createGitConfig = (env: { get: (key: string) => getEnv.IOptionalVariable }): GitOptions => {
  return {
    root: env.get('GIT_ROOT').required().asString(),
    queueName: 'main',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVersionConfig = (env: { npm_package_version?: string }, fs: any): string => {
  const buildNumPath = path.resolve(appRoot, '.build-number')
  if (!fs.existsSync(buildNumPath)) {
    throw new Error(`Build number file not found at ${buildNumPath}`)
  }
  return `${env.npm_package_version}.${fs.readFileSync(buildNumPath)}`
}

const createRedisConfig = (env: { get: (key: string) => getEnv.IOptionalVariable }): string => {
  return env.get('REDIS_URL').required().asString()
}

const createLoggerConfig = (env: { NODE_ENV?: string }): LoggerOptions => {
  return { readableBy: env.NODE_ENV === 'production' ? 'machines' : 'humans' }
}

type Environment = {
  NODE_ENV?: string
  GIT_ROOT?: string
  REDIS_URL?: string
  npm_package_version?: string
}

export const createConfig = (rawEnv: Environment = process.env, fs = require('fs')): Config => {
  const env = getEnv.from(rawEnv)
  if (!rawEnv.NODE_ENV) throw new Error('Please set NODE_ENV')
  return {
    git: createGitConfig(env),
    version: createVersionConfig(rawEnv, fs),
    redis: createRedisConfig(env),
    logger: createLoggerConfig(rawEnv),
  }
}
