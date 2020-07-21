import { Application, ConnectRepoRequest, GitRepoInfo } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from 'koa-router'

export default (app: Application, router: Router): Router =>
  new Router().post('/', async (ctx: Context) => {
    const request: ConnectRepoRequest = ctx.request.body
    const result = await app.getInfo(request.repoId)
    await result.respond({
      foundOne: redirectToExisting,
      foundNone: connect,
    })

    async function connect() {
      try {
        await app.connectToRemote(request)
        ctx.response.status = 202
      } catch {
        ctx.response.status = 400
      }
    }

    async function redirectToExisting(repoInfo: GitRepoInfo) {
      ctx.response.redirect(router.url('get-repo', repoInfo))
    }
  })
