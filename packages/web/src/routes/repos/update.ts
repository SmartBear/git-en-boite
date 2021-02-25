import { AccessDenied, Application, InvalidRepoUrl, RemoteUrl, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import Router from '@koa/router'
import validateRequestBody from '../../validate_request'

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
      try {
        await app.fetchFromRemote(RepoId.of(ctx.params.repoId))
        ctx.response.status = 200
      } catch (error) {
        console.log(error)
      }
    })
    .put(
      '/:repoId',
      async (ctx, next) => validateRequestBody(ctx, next, schema),
      async (ctx: Context) => {
        const parsedBody: ParsedBody = parseBody(ctx.request.body)
        const { remoteUrl } = parsedBody
        try {
          await app.connectToRemote(RepoId.of(ctx.params.repoId), remoteUrl)
          ctx.response.status = 200
        } catch (error) {
          // TODO: move to generic error handler
          switch (error.constructor) {
            case AccessDenied:
              ctx.throw(403, `Access denied to '${remoteUrl}': ${error.message}`)
            case InvalidRepoUrl:
              ctx.throw(400, `Repository '${remoteUrl}' not found.`)

            default:
              ctx.throw(error)
          }
        }
      },
    )
