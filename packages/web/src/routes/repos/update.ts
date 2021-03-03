import { Application, RemoteUrl, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'
import validateRequestBody from '../../validate_request'
import { handleRepoConnectionErrors } from './handleRepoConnectionErrors'

const schema = {
  type: 'object',
  title: 'request-payload',
  properties: {
    remoteUrl: { type: 'string' },
  },
  required: ['remoteUrl'],
}

type ParsedBody = { remoteUrl: RemoteUrl }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  remoteUrl: RemoteUrl.fromJSON(body.remoteUrl),
})

export default (app: Application): Router =>
  new Router()
    .post('/:repoId', async (ctx: Context) => {
      // TODO: move this on a different resource
      await app.fetchFromRemote(RepoId.of(ctx.params.repoId))
      ctx.response.status = 200
    })
    .put(
      '/:repoId',
      async (ctx, next) => validateRequestBody(ctx, next, schema),
      handleRepoConnectionErrors,
      async (ctx: Context) => {
        const parsedBody: ParsedBody = parseBody(ctx.request.body)
        const { remoteUrl } = parsedBody
        await app.connectToRemote(RepoId.of(ctx.params.repoId), remoteUrl)
        ctx.response.status = 200
      },
    )
