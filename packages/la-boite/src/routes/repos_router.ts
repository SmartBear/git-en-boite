import { Context } from 'koa'
import Router from 'koa-router'

export function create(): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    console.log(ctx.params.repoId)
    ctx.body = ['master']
  })

  return router
}

export default { create }
