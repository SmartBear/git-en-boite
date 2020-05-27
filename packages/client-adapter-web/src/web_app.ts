import Koa from 'koa'
import cors from 'koa2-cors'
import logger from 'koa-log'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'

function withRoutes(...routers: Router[]): Koa {
  const webApp = new Koa()
  if (process.env.NODE_ENV !== 'test')
    webApp.use(logger(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  for (const router of routers) {
    webApp.use(router.routes()).use(router.allowedMethods())
  }
  return webApp
}

export default { withRoutes }
