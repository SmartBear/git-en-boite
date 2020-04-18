import { Context } from 'koa'
import Router from 'koa-router'
import { ConnectRepoRequest } from './git_repos'
import { Application } from '../application'
import { GitRepo } from './git_repo'

interface Responder<ResultType> {
  foundOne: (result: ResultType) => Promise<void>
  foundNone: () => Promise<void>
}

class QueryResult<ResultType> {
  readonly results: ResultType[]

  constructor(...results: ResultType[]) {
    this.results = results.filter(result => !!result)
  }

  async respond(responder: Responder<ResultType>) {
    if (this.results.length === 1) return responder.foundOne(this.results[0])
    if (this.results.length === 0) return responder.foundNone()
  }
}

export function create({ repos }: Application): Router {
  const router = new Router({ prefix: '/repos' })

  router.get('/:repoId/branches', async (ctx: Context) => {
    const repo = repos.findRepo(ctx.params.repoId)
    const result = new QueryResult<GitRepo>(repo)
    await result.respond({
      foundOne: async (repo: GitRepo) => {
        ctx.body = await repo.branches()
      },
      foundNone: async () => {
        ctx.response.status = 404
      },
    })
  })

  router.post('/', async (ctx: Context) => {
    const connectRepoRequest: ConnectRepoRequest = ctx.request.body
    await repos.connectToRemote(connectRepoRequest)
    ctx.response.status = 200
  })

  return router
}

export default { create }
