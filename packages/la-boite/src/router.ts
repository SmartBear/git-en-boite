import { Context } from 'koa'
const Router = require('koa-router')
const Repo = require('./repo')
import { serializedListOfBranches, serializedListOfFiles } from './serializers'
const SseStream = require('ssestream')

const router = new Router()

let sse: any

router.get('/', async (ctx: Context) => {
  ctx.body = 'bonjour'
})

router.get('/files', async (ctx: Context) => {
  const files = await new Repo().getFiles('master')
  ctx.body = serializedListOfFiles(files)
})

router.get('/files/:branch*', async (ctx: Context) => {
  const files = await new Repo().getFiles(ctx.params.branch)
  ctx.body = serializedListOfFiles(files)
})

router.get('/branches', async (ctx: Context) => {
  const branches = await new Repo().getBranches()
  ctx.body = serializedListOfBranches(branches)
})

router.post('/github/webhooks', async (ctx: Context) => {
  await new Repo().pullFromOrigin()
  sse.write({ event: 'repository-updated', data: 'well done' })
  ctx.status = 200
})

router.get('/sse', (ctx: Context) => {
  sse = new SseStream(ctx.req)
  sse.pipe(ctx.res)
  ctx.body = sse
})

module.exports = router
