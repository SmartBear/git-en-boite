import { Application, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'
import { handleRepoErrors } from './handleRepoErrors'

export default (app: Application): Router =>
  new Router().get('get-repo', '/:repoId', handleRepoErrors, async (ctx: Context) => {
    const repoId = RepoId.of(ctx.params.repoId)
    const result = await app.getInfo(repoId)
    result.respond({
      foundOne: async (repoInfo) => {
        ctx.body = repoInfo
      },
      foundNone: async () => {
        ctx.response.status = 404
      },
    })
  })
