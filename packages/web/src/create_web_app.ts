import Router from '@koa/router'
import Cabin from 'cabin'
import { Logger } from 'git-en-boite-core'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'

export default (routes: Router = new Router(), logger: Logger): Koa => {
  const webApp = new Koa()
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(
    new Cabin({
      axe: { logger },
    }).middleware,
  )
  webApp.use(routes.middleware())
  webApp.use(routes.allowedMethods())
  return webApp
}
