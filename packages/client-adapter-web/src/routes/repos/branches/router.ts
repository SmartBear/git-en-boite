import { Application } from 'git-en-boite-client-port'
import Router from '@koa/router'

import commits from './commits'
import { buildHandlers } from '../../../build_handlers'

export default (app: Application, parentRouter: Router): Router => {
  const router = new Router()
  router.use(...buildHandlers([commits], app, parentRouter))
  return router
}
