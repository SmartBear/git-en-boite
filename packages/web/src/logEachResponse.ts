import Cabin from 'cabin'
import { Logger } from 'git-en-boite-core'
import { Middleware } from 'koa'

export function logEachResponse(logger: Logger): Middleware {
  return new Cabin({
    axe: { logger },
    capture: false,
  }).middleware
}
