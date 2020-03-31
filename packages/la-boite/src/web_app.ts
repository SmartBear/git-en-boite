import Koa from 'koa'
import cors from 'koa2-cors'
import { router } from './router'
import bodyParser from 'koa-bodyparser'

const webApp = new Koa()

webApp.use(bodyParser())
webApp.use(cors({ origin: '*' }))
webApp.use(router.routes()).use(router.allowedMethods())

export { webApp }
