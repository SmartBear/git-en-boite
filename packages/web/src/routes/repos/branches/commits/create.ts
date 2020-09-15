import Router from '@koa/router'
import { Application, Author, BranchName, CommitName, Files, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import validateRequestBody from '../../../../validate_request'

type ParsedBody = { files: Files; author: Author; message: CommitName }

const parseBody: (body: any) => ParsedBody = ({ files, author, message }) => {
  return {
    files: Files.fromJSON(files),
    author: Author.fromJSON(author),
    message: CommitName.of(message),
  }
}

const fileSchema = {
  type: 'object',
  propeties: {
    path: 'string',
    content: 'string',
  },
}

const authorSchema = {
  type: 'object',
  propeties: {
    name: 'string',
    email: 'string',
  },
}

const schema = {
  type: 'object',
  required: ['author'],
  properties: {
    message: { type: 'string' },
    files: {
      type: 'array',
      items: fileSchema,
    },
    author: authorSchema,
  },
}

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, schema),
    async (ctx: Context) => {
      const parsedBody: ParsedBody = parseBody(ctx.request.body)

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
