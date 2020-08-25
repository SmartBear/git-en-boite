import Router from '@koa/router'
import { Application, Author, BranchName, CommitName, Files, RepoId } from 'git-en-boite-core'
import { Context, Next } from 'koa'
import { createSchema as S, TsjsonParser } from 'ts-json-validator'

import {
  checkForMissingRequestBodyContent,
  validateRequestBody,
} from '../../../../validate_request'

type ParsedBody = { files: Files; author: Author; message: CommitName }

const parseBody: (body: string) => ParsedBody = (body: string) => {
  const parsed: {
    files: Array<{ path: string; content: string }>
    author: { name: string; email: string }
    message: string
  } = parser.parse(body)
  return {
    files: Files.fromJSON(parsed.files),
    author: Author.fromJSON(parsed.author),
    message: CommitName.of(parsed.message),
  }
}

const parser = new TsjsonParser(
  S({
    type: 'object',
    properties: {
      files: S({
        type: 'array',
      }),
      author: S({
        type: 'object',
        properties: {
          name: S({ type: 'string' }),
          email: S({ type: 'string' }),
        },
        required: ['name', 'email'],
      }),
      message: S({
        type: 'string',
      }),
    },
    required: ['author'],
  }),
)

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, validate),
    async (ctx: Context, next: Next) => {
      let parsedBody: ParsedBody
      try {
        parsedBody = parseBody(ctx.request.rawBody)
      } catch (error) {
        ctx.response.body = { error }
        ctx.response.status = 400
        return await next()
      }

      await app.commit(
        RepoId.of(ctx.params.repoId),
        BranchName.of(ctx.params.branchName),
        parsedBody.files,
        parsedBody.author,
        parsedBody.message,
      )
      ctx.body = {}
      ctx.status = 200
    },
  )

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['files', 'author'] })
}
