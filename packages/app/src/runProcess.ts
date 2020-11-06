import * as ErrorStackParser from 'error-stack-parser'
import { Config, createConfig } from 'git-en-boite-config'
import { Logger } from 'git-en-boite-core'
import { createLogger } from './createLogger'

const config = createConfig(process.env)
const logger = createLogger(config.logger)

export function runProcess(start: (config: Config, logger: Logger) => Promise<void>): void {
  start(config, logger).catch(error => {
    logger.error(error.message, { name: error.name, stack: ErrorStackParser.parse(error) })
    process.exit(1)
  })
}
