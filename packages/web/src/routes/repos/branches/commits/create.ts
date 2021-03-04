import Router from '@koa/router'
import { Application, Author, BranchName, CommitMessage, Files, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import { handleRepoErrors } from '../../handleRepoErrors'
import validateRequestBody from '../../../../validate_request'

const fileSchema = {
  type: 'object',
  required: ['path', 'content'],
  properties: {
    path: { type: 'string' },
    content: { type: 'string' },
  },
}

const authorSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
  },
}

const schema = {
  type: 'object',
  required: ['files', 'author', 'message'],
  properties: {
    files: {
      type: 'array',
      items: fileSchema,
    },
    author: authorSchema,
    message: { type: 'string' },
  },
}

export default (app: Application): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, schema),
    handleRepoErrors,
    async (ctx: Context) => {
      await app.commit(
        RepoId.of(ctx.params.repoId),
        BranchName.of(ctx.params.branchName),
        Files.fromJSON(ctx.request.body.files),
        Author.fromJSON(ctx.request.body.author),
        CommitMessage.of(ctx.request.body.message)
      )
      ctx.body = {}
      ctx.status = 200
    }
  )
