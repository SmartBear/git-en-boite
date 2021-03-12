import { AccessDenied, InvalidRepoUrl, LockedByAnotherProcess, Unauthorized } from 'git-en-boite-core'
import { Context, Next } from 'koa'

export async function handleRepoErrors(ctx: Context, next: Next): Promise<void> {
  try {
    await next()
  } catch (error) {
    switch (error.constructor) {
      case Unauthorized:
        ctx.throw(401, 'Unauthorized')
      case AccessDenied:
        ctx.throw(403, `Access denied: ${error.message}`)
      case InvalidRepoUrl:
        ctx.throw(400, `No git repository found at that URL.`)
      case LockedByAnotherProcess:
        ctx.status = 429
        ctx.set('retry-after', '60')
        ctx.body = error.message
        return

      default:
        ctx.throw(error)
    }
  }
}
