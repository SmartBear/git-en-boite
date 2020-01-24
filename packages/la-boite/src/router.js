const Router = require('koa-router')
const Repo = require('./repo')
const { serializedListOfBranches, serializedListOfFiles } = require('./serializers')

const router = new Router()

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
  ctx.status = 200
})

module.exports = router
