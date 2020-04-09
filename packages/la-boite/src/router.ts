import { Context } from 'koa'
import Router from 'koa-router'
import { Repo } from './repo'
import { serializedListOfBranches, serializedListOfFiles } from './serializers'
import ReposRouter from './repos/repos_router'
import { GitRepos } from './repos/git_repos'
import { createConfig } from './config'

function create(app: GitRepos): Router {
  const router = new Router()

  router.get('/', async (ctx: Context) => {
    const config = createConfig()
    ctx.body = `Bonjour, je suis la boîte, version ${config.version}`
  })

  router.use(ReposRouter.create(app).routes())

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

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SseStream = require('ssestream')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sse: any
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

  return router
}

export default { create }
