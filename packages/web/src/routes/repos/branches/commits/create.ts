import Router, { RouterContext } from '@koa/router'
import { Application, Author, BranchName, CommitMessage, RepoId, Files } from 'git-en-boite-core'
import { Context } from 'koa'

import {
  checkForMissingRequestBodyContent,
  validateRequestBody,
} from '../../../../validate_request'
import { body, IValidationState, validationResults } from 'koa-req-validation'

const returnValidationErrors = async (ctx: RouterContext<IValidationState>, next: Next) => {
  const result = validationResults(ctx)
  if (!result.hasErrors()) return next()
  ctx.response.body = { error: result.mapped() }
  ctx.response.status = 400
}

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, validate),
    body('files')
      .custom(async (json: unknown) => {
        Files.fromJSON(json)
      })
      .build(),
    returnValidationErrors,
    async (ctx: Context) => {
      await app.commit(
        RepoId.of(ctx.params.repoId),
        BranchName.of(ctx.params.branchName),
        Files.fromJSON(ctx.request.body.files as unknown),
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
