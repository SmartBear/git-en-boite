import Router from '@koa/router'
import { Application, GitRepoInfo } from 'git-en-boite-client-port'
import { Context } from 'koa'

import { checkForMissingRequestBodyContent, validateRequestBody } from '../../validate_request'

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    (ctx, next) => validateRequestBody(ctx, next, validate),
    async (ctx: Context) => {
      const { repoId, remoteUrl } = ctx.request.body
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
        ctx.response.redirect(router.url('get-repo', repoInfo))
      }
    },
  )

interface ValidateRepoId {
  (repoId: string): void
}

const InvalidRepoIdError = Error(
  'Invalid repoId: We do not expect characters in repoId which must be url encoded.',
)

const validateRepoId: ValidateRepoId = repoId => {
  if (encodeURIComponent(repoId) !== repoId) {
    throw InvalidRepoIdError
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (received: any) => {
  checkForMissingRequestBodyContent({ received, expected: ['repoId', 'remoteUrl'] })
  validateRepoId(received.repoId)
}

export { InvalidRepoIdError, validateRepoId }
