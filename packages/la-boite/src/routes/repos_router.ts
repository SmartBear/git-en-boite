import { Context } from 'koa'
import Router from 'koa-router'

export function create(): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    ctx.body = ['master-todo']
  })

  return router
}

export default { create }
