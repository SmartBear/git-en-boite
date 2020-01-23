const Koa = require('koa')
const cors = require('koa2-cors')
const router = require('./router')

const app = new Koa()

app.use(cors({ origin: '*' }))
app.use(router.routes()).use(router.allowedMethods())

app.listen(3001)
