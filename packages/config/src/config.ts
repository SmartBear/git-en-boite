import * as getEnv from 'env-var'
import { LoggerOptions } from 'git-en-boite-logging'

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

const createGitConfig = (env: { get: (key: string) => getEnv.IOptionalVariable }): GitOptions => {
  return {
    root: env.get('GIT_ROOT').required().asString(),
    queueName: 'main',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createVersionConfig = (env: ReadableEnvironment): string => {
  const packageVersion = env.get('npm_package_version').required().asString()
  const gitRef = env.get('git_ref').default('dev').asString()
  const buildNumber = env.get('build_number').default('dev').asString()
  return `${packageVersion}.${buildNumber}#${gitRef}`
}

type ReadableEnvironment = { get: (key: string) => getEnv.IOptionalVariable }

const createRedisConfig = (env: ReadableEnvironment): string => {
  return env.get('REDIS_URL').required().asString()
}

const createLoggerConfig = (env: ReadableEnvironment): LoggerOptions => {
  return {
    readableBy:
      env.get('NODE_ENV').required().asString() === 'production'
        ? 'machines'
        : env.get('show_logs').asBool()
        ? 'humans'
        : 'nobody',
  }
}

type Environment = {
  NODE_ENV?: string
  GIT_ROOT?: string
  REDIS_URL?: string
  npm_package_version?: string
}

export const createConfig = (rawEnv: Environment = process.env): Config => {
  const env = getEnv.from(rawEnv)
  env.get('NODE_ENV').required()
  return {
    git: createGitConfig(env),
    version: createVersionConfig(env),
    redis: createRedisConfig(env),
    logger: createLoggerConfig(env),
  }
}
