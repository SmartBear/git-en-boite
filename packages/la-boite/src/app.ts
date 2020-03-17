import Koa from 'koa'
const cors = require('koa2-cors')
const router = require('./router')
const bodyParser = require('koa-bodyparser')

const app = new Koa()

app.use(bodyParser())
app.use(cors({ origin: '*' }))
app.use(router.routes()).use(router.allowedMethods())

module.exports = { app }