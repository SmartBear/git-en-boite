import { Application } from 'git-en-boite-client-port'
import Router from '@koa/router'

import { interceptRequestBody } from '../../intercept_request'
import create from './create'
import get from './get'
import update from './update'
import commits from './commits'
import { buildHandlers } from '../../build_handlers'

export default (app: Application, parentRouter: Router): Router => {
  const router = new Router()
  router.use(interceptRequestBody)
  router.use(...buildHandlers([get, create, update, commits], app, parentRouter))
  return router
}
