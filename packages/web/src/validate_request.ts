import { Context } from 'koa'

interface CheckForMissingRequestBodyContent {
  ({ received, expected }: { received: unknown; expected: Array<string> }): void
}

interface ValidateRequestBody {
  (ctx: Context, next: () => Promise<void>, validate: (received: any) => void): void
}

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

const validateRequestBody: ValidateRequestBody = async (ctx, next, validate) => {
  const request = ctx.request
  try {
    validate(request.body)
  } catch (error) {
    ctx.status = 400
    ctx.response.body = { error: error.message }
    return
  }
  await next()
}

export { validateRequestBody, checkForMissingRequestBodyContent }
