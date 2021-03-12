import { Context } from 'koa'
import Router from '@koa/router'
import { Application, RepoId } from 'git-en-boite-core'

export default (app: Application): Router =>
  new Router().get('/(.*)', async (ctx: Context) => {
    app.getFileContent(new RepoId(ctx.params.repoId), ctx.params.ref, ctx.params[0])
    ctx.body = ''
    ctx.response.status = 200
  })
