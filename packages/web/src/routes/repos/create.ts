import Router from '@koa/router'
import { Application, GitRepoInfo, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'

import { checkForMissingRequestBodyContent, validateRequestBody } from '../../validate_request'

type CreateRepoRequestBody = {
  repoId: string
  remoteUrl: string
}

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    (ctx, next) => validateRequestBody(ctx, next, validate),
    (ctx, next) =>
      validateRequestBody(ctx, next, (body: CreateRepoRequestBody) => {
        RepoId.fromJSON(body.repoId)
      }),
    async (ctx: Context) => {
      const repoId = RepoId.fromJSON(ctx.request.body.repoId)
      const { remoteUrl } = ctx.request.body
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['repoId', 'remoteUrl'] })
}
