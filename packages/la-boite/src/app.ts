import Koa from 'koa'
import cors from 'koa2-cors'
import { router } from './router'
import bodyParser from 'koa-bodyparser'

const app = new Koa()

app.use(bodyParser())
app.use(cors({ origin: '*' }))
app.use(router.routes()).use(router.allowedMethods())

export { app }