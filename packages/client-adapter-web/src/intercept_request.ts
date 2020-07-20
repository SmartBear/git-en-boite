import { Context } from 'koa'

interface CheckForMissingRequestBodyContent {
  ({ received, expected }: { received: unknown; expected: Array<string> }): void
}

interface InterceptRequestBody {
  (ctx: Context, next: () => Promise<void>): void
}

interface RequestBodyContentHandlers {
  [key: string]: (received: any) => void
}

interface ValidateRepoId {
  (repoId: string): void
}

const InvalidRepoIdError = Error(
  'Invalid repoId: We do not expect characters in repoId which must be url encoded.',
)

const checkForMissingRequestBodyContent: CheckForMissingRequestBodyContent = ({
  received,
  expected,
}) => {
  const missingRequestBodyContent = expected.filter(
    (param: string) => !Object.keys(received).includes(param),
  )
  if (missingRequestBodyContent.length) {
    throw Error(`Missing information from the request: ${missingRequestBodyContent.join(', ')}`)
  }
}

const validateRepoId: ValidateRepoId = repoId => {
  if (encodeURIComponent(repoId) !== repoId) {
    throw InvalidRepoIdError
  }
}

const requestBodyContentHandlers: RequestBodyContentHandlers = {
  'POST/repos': received => {
    checkForMissingRequestBodyContent({ received, expected: ['repoId', 'remoteUrl'] })
    validateRepoId(received.repoId)
  },
}

const interceptRequestBody: InterceptRequestBody = async (ctx, next) => {
  const request = ctx.request
  const handler = requestBodyContentHandlers[`${request.method + request.url}`]
  if (handler) {
    try {
      handler(request.body)
    } catch (error) {
      ctx.status = 400
      ctx.response.body = { error: error.message }
      return
    }
  }
  await next()
}

export {
  interceptRequestBody,
  validateRepoId,
  checkForMissingRequestBodyContent,
  InvalidRepoIdError,
}
