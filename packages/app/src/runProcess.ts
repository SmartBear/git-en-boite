import { Config, createConfig } from 'git-en-boite-config'
import { LogEvent, WriteLogEvent } from 'git-en-boite-core'
import { setUpLogger } from 'git-en-boite-logging'

const config = createConfig(process.env)
const logThat = setUpLogger(
  {
    version: config.version,
    environment: process.env.NODE_ENV,
    service: 'git-en-boite',
  },
  config.logging
)
const serverFailedToStart: (error: Error) => LogEvent = (error) => {
  const props: LogEvent = {
    level: 'fatal',
    message: error.message,
    stack: error.stack,
  }
  return Object.assign(props, error)
}

export function runProcess(start: (config: Config, logThat: WriteLogEvent) => Promise<void>): void {
  start(config, logThat).catch((error) => {
    logThat(serverFailedToStart(error))
    process.exit(1)
  })
}
