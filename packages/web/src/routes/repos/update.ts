import { Application, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application): Router =>
  new Router().post('/:repoId', async (ctx: Context) => {
    await app.fetchFromRemote(RepoId.of(ctx.params.repoId))
    ctx.response.status = 200
  })
