const Router = require('koa-router')
const Repo = require('./repo')
const { serializedListOfBranches, serializedListOfFiles } = require('./serializers')
const SseStream = require('ssestream')

const router = new Router()

let sse

router.get('/files', async ctx => {
  const files = await new Repo().getFiles('master')
  ctx.body = serializedListOfFiles(files)
})

router.get('/files/:branch*', async ctx => {
  const files = await new Repo().getFiles(ctx.params.branch)
  ctx.body = serializedListOfFiles(files)
})

router.get('/branches', async ctx => {
  const branches = await new Repo().getBranches()
  ctx.body = serializedListOfBranches(branches)
})

router.post('/github/webhooks', async ctx => {
  await new Repo().pullFromOrigin()
  sse.write({ event: 'repository-updated', data: 'well done' })
  ctx.status = 200
})

router.get('/sse', ctx => {
  sse = new SseStream(ctx.req)
  sse.pipe(ctx.res)
  ctx.body = sse
})

module.exports = router
