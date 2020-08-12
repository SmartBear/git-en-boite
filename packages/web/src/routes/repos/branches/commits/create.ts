import { Application } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application): Router =>
  new Router().post('/', async (ctx: Context) => {
    await app.commit(ctx.params.repoId, ctx.params.branchName, ctx.request.body)
    ctx.body = {}
    ctx.status = 200
  })
