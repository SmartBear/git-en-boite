import { Application } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'

import repos from './repos/router'

export default (app: Application): Router => {
  const router = new Router()
  return router
    .get('/', async (ctx: Context) => {
      ctx.body = `Bonjour, je suis la boîte, version ${app.version}`
    })

    .use('/repos', repos(app, router).routes(), repos(app, router).allowedMethods())
}
