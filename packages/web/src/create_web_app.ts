import Router from '@koa/router'
import { WriteLogEvent } from 'git-en-boite-core'
import Koa, { Context } from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import { logErrorsFrom, makeHttpLoggingMiddleware } from 'git-en-boite-logging'

const throwErrors = new Router()
  .get('/error', (ctx: Context) => ctx.throw('An error', { some: 'metadata' }))
  .middleware()

export default function createWebApp(routes: Router = new Router(), log: WriteLogEvent): Koa {
  const webApp = logErrorsFrom(new Koa()).to(log)
  webApp.use(makeHttpLoggingMiddleware(log))
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(routes.middleware())
  webApp.use(routes.allowedMethods())
  if (process.env.NODE_ENV === 'development') {
    webApp.use(throwErrors)
  }
  return webApp
}
