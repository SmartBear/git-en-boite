import { Application } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application): Router =>
  new Router().post('/:repoId', async (ctx: Context) => {
    await app.fetchFromRemote({ repoId: ctx.params.repoId })
    ctx.response.status = 202
  })
