import { Context } from 'koa'
import Router from 'koa-router'
import { GitRepos } from './git_repos'

export function create({ findRepo }: GitRepos): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    const repo = findRepo(ctx.params.repoId)
    ctx.body = repo.branches
  })

  return router
}

export default { create }
