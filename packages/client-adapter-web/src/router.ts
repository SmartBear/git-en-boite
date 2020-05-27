import { Application } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from 'koa-router'

import ReposRouter from './repos_router'

function create(app: Application): Router {
  const router = new Router()

  router.get('/', async (ctx: Context) => {
    ctx.body = `Bonjour, je suis la boîte, version ${app.version}`
  })

  router.use(ReposRouter.create(app).routes())

  return router
}

export default { create }
