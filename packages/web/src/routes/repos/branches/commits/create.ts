import { Application, BranchName, File, Author, CommitMessage, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'
import {
  checkForMissingRequestBodyContent,
  validateRequestBody,
} from '../../../../validate_request'

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, validate),
    async (ctx: Context) => {
      await app.commit(
        RepoId.of(ctx.params.repoId),
        BranchName.of(ctx.params.branchName),
        ctx.request.body.files as File[],
        new Author(ctx.request.body.author.name, ctx.request.body.author.email),
        new CommitMessage(ctx.request.body.message),
      )
      ctx.body = {}
      ctx.status = 200
    },
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['files', 'author'] })
}
