import Koa from 'koa'
import cors from 'koa2-cors'
import Router from './router'
import bodyParser from 'koa-bodyparser'

function create(): Koa {
  const webApp = new Koa()
  const router = Router.create()
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(router.routes()).use(router.allowedMethods())
  return webApp
}

export { create }
