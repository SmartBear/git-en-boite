import { Context } from 'koa'
import Router from 'koa-router'
import { GitRepos } from './git_repos'

export function create(repos: GitRepos): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    const repo = repos.findRepo(ctx.params.repoId)
    ctx.body = repo.branches
  })

  router.post('/', async (ctx: Context) => {
    console.log(ctx.request.body)
    ctx.response.status = 200
  })

  return router
}

export default { create }
