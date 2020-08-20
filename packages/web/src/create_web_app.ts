import Koa from 'koa'
import cors from 'koa2-cors'
import logger from 'koa-log'
import bodyParser from 'koa-bodyparser'
import Router from '@koa/router'

export default (routes: Router = new Router()): Koa => {
  const webApp = new Koa()
  if (process.env.NODE_ENV !== 'test')
    webApp.use(logger(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(routes.middleware())
  webApp.use(routes.allowedMethods())
  return webApp
}
