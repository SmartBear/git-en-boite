import { Context } from 'koa'
import Router from 'koa-router'
import ReposRouter from './repos/repos_router'
import { createConfig } from './config'
import { Application } from './application'

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
