import { Application } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application): Router =>
  new Router().post('/:repoId/branches/:branchName/commits', async (ctx: Context) => {
    app.commit({
      repoId: ctx.params.repoId,
      branchName: ctx.params.branchName,
      file: ctx.request.body,
    })
    ctx.body = {}
    ctx.status = 200
  })
