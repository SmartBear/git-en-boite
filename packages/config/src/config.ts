import path from 'path'

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

const createGitConfig = (env: { GIT_ROOT?: string }): GitOptions => {
  if (!env.GIT_ROOT) throw new Error('Please set GIT_ROOT')
  return {
    root: env.GIT_ROOT,
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

const createRedisConfig = (env: { REDIS_URL?: string }): string => {
  if (!env.REDIS_URL) throw new Error('Please set REDIS_URL')
  return env.REDIS_URL
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

export const createConfig = (env: Environment = process.env, fs = require('fs')): Config => {
  if (!env.NODE_ENV) throw new Error('Please set NODE_ENV')
  return {
    git: createGitConfig(env),
    version: createVersionConfig(env, fs),
    redis: createRedisConfig(env),
    logger: createLoggerConfig(env),
  }
}
