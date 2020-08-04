import { Application, ConnectRepoRequest, GitRepoInfo } from 'git-en-boite-client-port'
import { Context } from 'koa'
import Router from '@koa/router'

export default (app: Application, router: Router): Router =>
  new Router().post('/:repoId/branches/:branchName/commits', async (ctx: Context) => {
    ctx.body = {}
    ctx.status = 200
  })