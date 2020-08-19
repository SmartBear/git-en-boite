import { Application, BranchName, File, Author } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application): Router =>
  new Router().post('/', async (ctx: Context) => {
    console.log(
      typeof ctx.params.repoId,
      typeof ctx.params.branchName,
      typeof ctx.request.body.author,
    )
    await app.commit(
      ctx.params.repoId,
      BranchName.of(ctx.params.branchName),
      ctx.request.body.files as File[],
      new Author(ctx.request.body.author.name, ctx.request.body.author.email),
    )
    ctx.body = {}
    ctx.status = 200
  })
