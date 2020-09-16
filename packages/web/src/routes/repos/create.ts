import Router from '@koa/router'
import { Application, RepoSnapshot, RemoteUrl, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import validateRequestBody from '../../validate_request'

const schema = {
  type: 'object',
  title: 'request-payload',
  properties: {
    repoId: { type: 'string' },
    remoteUrl: { type: 'string' },
  },
  required: ['repoId', 'remoteUrl'],
}

type ParsedBody = { repoId: RepoId; remoteUrl: RemoteUrl }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  repoId: RepoId.fromJSON(body.repoId),
  remoteUrl: RemoteUrl.fromJSON(body.remoteUrl),
})

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, schema),
    async (ctx: Context) => {
      const parsedBody: ParsedBody = parseBody(ctx.request.body)
      const { repoId, remoteUrl } = parsedBody
      const result = await app.getInfo(repoId)
      await result.respond({
        foundOne: redirectToExisting,
        foundNone: connect,
      })

      async function connect() {
        try {
          await app.connectToRemote(repoId, remoteUrl)
          ctx.response.status = 202
        } catch (error) {
          ctx.throw(400, `Could not connect to a Git HTTP server using remoteUrl '${remoteUrl}'`)
        }
      }

      async function redirectToExisting(repoInfo: RepoSnapshot) {
        ctx.response.redirect(router.url('get-repo', { repoId: repoInfo.repoId.urlEncode() }))
      }
    },
  )
