import Router from '@koa/router'
import { Application, GitRepoInfo, RemoteUrl, RepoId } from 'git-en-boite-core'
import { Context, Next } from 'koa'

import { checkForMissingRequestBodyContent, validateRequestBody } from '../../validate_request'

type ParsedBody = { repoId: RepoId; remoteUrl: RemoteUrl }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  repoId: RepoId.fromJSON(body.repoId),
  remoteUrl: RemoteUrl.fromJSON(body.remoteUrl),
})

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    (ctx, next) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateRequestBody(ctx, next, (received: any) => {
        checkForMissingRequestBodyContent({ received, expected: ['repoId', 'remoteUrl'] })
      }),
    async (ctx: Context, next: Next) => {
      let parsedBody: ParsedBody
      try {
        parsedBody = parseBody(ctx.request.body)
      } catch (error) {
        ctx.response.body = { error }
        ctx.response.status = 400
        return next()
      }
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
        } catch {
          ctx.response.status = 400
        }
      }

      async function redirectToExisting(repoInfo: GitRepoInfo) {
        ctx.response.redirect(router.url('get-repo', { repoId: repoInfo.repoId.value }))
      }
    },
  )
