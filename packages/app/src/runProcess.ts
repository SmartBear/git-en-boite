import { Config, createConfig } from 'git-en-boite-config'
import { LogEvent, WriteLogEvent } from 'git-en-boite-core'
import { logToPino, setUpLogger } from 'git-en-boite-logging'

const config = createConfig(process.env)
const log = logToPino(
  setUpLogger(
    {
      version: config.version,
      environment: process.env.NODE_ENV,
      service: 'git-en-boite',
    },
    config.logger,
  ),
)
const serverFailedToStart: (error: Error) => LogEvent = error => {
  const props: LogEvent = {
    level: 'fatal',
    message: error.message,
    stack: error.stack,
  }
  return Object.assign(props, error)
}

export function runProcess(start: (config: Config, log: WriteLogEvent) => Promise<void>): void {
  start(config, log).catch(error => {
    log(serverFailedToStart(error))
    process.exit(1)
  })
}
