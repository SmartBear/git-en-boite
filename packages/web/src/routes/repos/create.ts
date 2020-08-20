import Router, { RouterContext } from '@koa/router'
import { Application, GitRepoInfo, RepoId, RemoteUrl } from 'git-en-boite-core'
import { Context, Next } from 'koa'
import { body, IValidationState, validationResults } from 'koa-req-validation'

import { checkForMissingRequestBodyContent, validateRequestBody } from '../../validate_request'

const returnValidationErrors = async (ctx: RouterContext<IValidationState>, next: Next) => {
  const result = validationResults(ctx)
  if (!result.hasErrors()) return next()
  ctx.response.body = { error: result.mapped() }
  ctx.response.status = 400
}

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    (ctx, next) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validateRequestBody(ctx, next, (received: any) => {
        checkForMissingRequestBodyContent({ received, expected: ['repoId', 'remoteUrl'] })
      }),
    body('repoId')
      .custom(async (json: string) => {
        RepoId.fromJSON(json)
      })
      .build(),
    returnValidationErrors,
    async (ctx: Context) => {
      const repoId = RepoId.fromJSON(ctx.request.body.repoId)
      const remoteUrl = RemoteUrl.fromJSON(ctx.request.body.remoteUrl)
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
