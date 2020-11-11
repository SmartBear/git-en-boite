import Router from '@koa/router'
import Cabin from 'cabin'
import { Logger } from 'git-en-boite-core'
import Koa, { Context, Next } from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'

export default (routes: Router = new Router(), logger: Logger): Koa => {
  const webApp = new Koa()
  webApp.silent = true
  // webApp.use((ctx: Context, next: Next) => next().catch(logger.error))
  webApp.use(
    new Cabin({
      axe: { logger },
      capture: false,
    }).middleware,
  )
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(routes.middleware())
  webApp.use(routes.allowedMethods())
  return webApp
}
