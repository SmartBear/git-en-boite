import Router from '@koa/router'
import { Application, RepoSnapshot, RemoteUrl, RepoId } from 'git-en-boite-core'
import { Context, Next } from 'koa'
import Ajv, { ErrorObject } from 'ajv'

const schema = {
  type: 'object',
  properties: {
    repoId: { type: 'string' },
    remoteUrl: { type: 'string' },
  },
  required: ['repoId', 'remoteUrl'],
}

const makeErrorMessage = (errors: ErrorObject[]) => {
  return Object.values(errors)
    .map((entry: ErrorObject): string => entry.message)
    .join(', ')
}

const validateRequestBody = async (ctx: Context, next: Next) => {
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)
  const valid = validate(ctx.request.body)
  if (!valid) {
    ctx.response.body = { error: makeErrorMessage(validate.errors) }
    ctx.response.status = 400
    return
  }
  await next()
}

type ParsedBody = { repoId: RepoId; remoteUrl: RemoteUrl }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  repoId: RepoId.fromJSON(body.repoId),
  remoteUrl: RemoteUrl.fromJSON(body.remoteUrl),
})

export default (app: Application, router: Router): Router =>
  new Router().post('/', validateRequestBody, async (ctx: Context) => {
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
      } catch {
        ctx.response.status = 400
        ctx.response.body = {
          error: `Could not connect to a Git HTTP server using remoteUrl '${remoteUrl}'`,
        }
      }
    }

    async function redirectToExisting(repoInfo: RepoSnapshot) {
      ctx.response.redirect(router.url('get-repo', { repoId: repoInfo.repoId.urlEncode() }))
    }
  })
