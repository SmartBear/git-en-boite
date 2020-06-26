import { Application, ConnectRepoRequest, GitRepoInfo } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from 'koa-router'

export function create(app: Application): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('repo', '/:repoId', async (ctx: Context) => {
    const { repoId } = ctx.params
    const result = await app.getInfo(repoId)
    result.respond({
      foundOne: async repoInfo => {
        ctx.body = repoInfo
      },
      foundNone: async () => {
        ctx.response.status = 404
      },
    })
  })

  router.post('/', async (ctx: Context) => {
    const request: ConnectRepoRequest = ctx.request.body
    const result = await app.getInfo(request.repoId)
    await result.respond({
      foundOne: redirectToExisting,
      foundNone: connect,
    })

    async function connect() {
      try {
        await app.connectToRemote(request)
        ctx.response.status = 202
      } catch {
        ctx.response.status = 400
      }
    }

    async function redirectToExisting(repoInfo: GitRepoInfo) {
      ctx.response.redirect(router.url('repo', repoInfo))
    }
  })

  router.post('/:repoId', async (ctx: Context) => {
    await app.fetchFromRemote({ repoId: ctx.params.repoId })
    ctx.response.status = 202
  })

  return router
}

export default { create }
