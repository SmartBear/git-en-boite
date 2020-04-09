import Koa from 'koa'
import cors from 'koa2-cors'
import logger from 'koa-log'
import Router from './router'
import bodyParser from 'koa-bodyparser'
import { GitRepos } from './repos/git_repos'

function create(app: GitRepos): Koa {
  const webApp = new Koa()
  const router = Router.create(app)
  webApp.use(logger('combined'))
  webApp.use(bodyParser())
  webApp.use(cors({ origin: '*' }))
  webApp.use(router.routes()).use(router.allowedMethods())
  return webApp
}

export { create }
