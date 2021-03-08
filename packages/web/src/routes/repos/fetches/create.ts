import Router from '@koa/router'
import { Application, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'

import { handleRepoErrors } from './../handleRepoErrors'

export default (app: Application): Router =>
  new Router().post('/', handleRepoErrors, async (ctx: Context) => {
    await app.fetchFromRemote(RepoId.of(ctx.params.repoId))
    ctx.response.status = 200
  })
