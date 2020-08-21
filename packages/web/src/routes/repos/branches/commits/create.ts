import Router from '@koa/router'
import { Application, Author, BranchName, CommitMessage, GitFiles, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'

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
        GitFiles.fromRequest(ctx.request.body.files),
        new Author(ctx.request.body.author.name, ctx.request.body.author.email),
        CommitMessage.of(ctx.request.body.message),
      )
      ctx.body = {}
      ctx.status = 200
    },
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['files', 'author'] })
}
