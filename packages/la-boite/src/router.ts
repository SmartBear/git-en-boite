import { Application } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from 'koa-router'

import { createConfig } from './config'
import ReposRouter from './repos/repos_router'

function create(app: Application): Router {
  const router = new Router()

  router.get('/', async (ctx: Context) => {
    const config = createConfig()
    ctx.body = `Bonjour, je suis la boîte, version ${config.version}`
  })

  router.use(ReposRouter.create(app).routes())

  return router
}

export default { create }
