import { Context } from 'koa'
import Router from '@koa/router'
import { Application, RepoId } from 'git-en-boite-core'

export default (app: Application): Router =>
  new Router().get('/(.*)', async (ctx: Context) => {
    const result = await app.getFileContent(new RepoId(ctx.params.repoId), ctx.params.ref, ctx.params[0])
    result.respond({
      foundOne: async (fileContent) => {
        ctx.body = fileContent.value
        ctx.response.set('content-type', 'application/octet-stream')
      },
    })
  })
