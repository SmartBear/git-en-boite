import Router from '@koa/router'
import {
  Application,
  Author,
  BranchName,
  CommitMessage,
  CommitName,
  Files,
  RepoId,
} from 'git-en-boite-core'
import { Context, Next } from 'koa'

import {
  checkForMissingRequestBodyContent,
  validateRequestBody,
} from '../../../../validate_request'

type ParsedBody = { files: Files; author: Author; commitMessage: CommitName }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  files: Files.fromJSON(body.files as unknown),
  author: new Author(body.author.name, body.author.email),
  commitMessage: CommitMessage.of(body.message),
})

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, validate),
    async (ctx: Context, next: Next) => {
      let parsedBody: ParsedBody
      try {
        parsedBody = parseBody(ctx.request.body)
      } catch (error) {
        ctx.response.body = { error }
        ctx.response.status = 400
        return next()
      }

      await app.commit(
        RepoId.of(ctx.params.repoId),
        BranchName.of(ctx.params.branchName),
        parsedBody.files,
        parsedBody.author,
        parsedBody.commitMessage,
      )
      ctx.body = {}
      ctx.status = 200
    },
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['files', 'author'] })
}
