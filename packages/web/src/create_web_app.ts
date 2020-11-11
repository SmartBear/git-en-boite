import Router from '@koa/router'
import { Logger } from 'git-en-boite-core'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import { logEachResponse } from './logEachResponse'

export default function createWebApp(routes: Router = new Router(), logger: Logger): Koa {
  const webApp = new Koa()
  webApp.on('error', error => logger.error(error))
  webApp.use(logEachResponse(logger))
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(routes.middleware())
  webApp.use(routes.allowedMethods())
  return webApp
}
