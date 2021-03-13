import { Context } from 'koa'
import Router from '@koa/router'
import { Application, CommitName, FilePath, RepoId } from 'git-en-boite-core'

export default (app: Application): Router =>
  new Router().get('/(.*)', async (ctx: Context) => {
    const repoId = RepoId.of(ctx.params.repoId)
    const ref = CommitName.of(ctx.params.ref)
    const path = new FilePath(ctx.params[0])
    const result = await app.getFileContent(repoId, ref, path)
    result.respond({
      foundOne: async (fileContent) => {
        ctx.body = fileContent.value
        ctx.response.set('content-type', 'application/octet-stream')
      },
    })
  })
