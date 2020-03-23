import { Context } from 'koa'
import Router from 'koa-router'
import { Repo } from './repo'
import { serializedListOfBranches, serializedListOfFiles } from './serializers'

/* tslint:disable-next-line: no-var-requires */
const SseStream = require('ssestream')

const router = new Router()

let sse: any

router.get('/', async (ctx: Context) => {
  ctx.body = 'Bonjour, je suis la boîte.'
})

router.get('/files', async (ctx: Context) => {
  const files: string[] = await new Repo().getFiles('master')
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

export { router }
