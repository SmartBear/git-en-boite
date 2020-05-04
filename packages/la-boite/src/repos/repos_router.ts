import { Context } from 'koa'
import Router from 'koa-router'
import { ConnectRepoRequest } from './interfaces'
import { Application } from '../application'

export function create({ repos }: Application): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId', async (ctx: Context) => {
    const { repoId } = ctx.params
    const result = await repos.getInfo(repoId)
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
    const connectRepoRequest: ConnectRepoRequest = ctx.request.body
    await repos.connectToRemote(connectRepoRequest)
    ctx.response.status = 202
  })

  router.post('/:repoId', async (ctx: Context) => {
    await repos.fetchFromRemote({ repoId: ctx.params.repoId })
    ctx.response.status = 202
  })

  return router
}

export default { create }
