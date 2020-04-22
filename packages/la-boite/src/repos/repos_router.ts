import { Context } from 'koa'
import Router from 'koa-router'
import { ConnectRepoRequest } from './git_repos'
import { Application } from '../application'
import { GitRepo } from './git_repo'

export function create({ repos }: Application): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    await repos.findRepo(ctx.params.repoId).respond({
      foundOne: async (repo: GitRepo) => {
        ctx.body = await repo.branches()
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

  return router
}

export default { create }
