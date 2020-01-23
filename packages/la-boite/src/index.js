const Koa = require('koa')
const Router = require('koa-router')
const cors = require('koa2-cors')
const Repo = require('./repo')

const app = new Koa()
const router = new Router()

const serializedListOfFiles = files => ({
  data: files.map((file, index) => ({
    type: 'file',
    id: index,
    attributes: {
      path: file
    }
  }))
})

const serializedListOfBranches = branches => ({
  data: branches.map((branch, index) => ({
    type: 'branch',
    id: index,
    attributes: {
      name: branch
    }
  }))
})

app.use(cors({ origin: '*' }))

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

app.use(router.routes()).use(router.allowedMethods())

app.listen(3001)
