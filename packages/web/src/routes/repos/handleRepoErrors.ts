import { AccessDenied, InvalidRepoUrl } from 'git-en-boite-core'
import { Context, Next } from 'koa'

export async function handleRepoErrors(ctx: Context, next: Next): Promise<void> {
  try {
    await next()
  } catch (error) {
    switch (error.constructor) {
      case AccessDenied:
        ctx.throw(403, `Access denied: ${error.message}`)
      case InvalidRepoUrl:
        ctx.throw(400, `No git repository found at that URL.`)

      default:
        ctx.throw(error)
    }
  }
}
