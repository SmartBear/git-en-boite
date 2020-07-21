import { Application } from 'git-en-boite-client-port'
import Router from 'koa-router'

import { interceptRequestBody } from '../../intercept_request'
import create from './create'
import get from './get'
import update from './update'

export default (app: Application, parentRouter: Router): Router => {
  const router = new Router()
  router.use(interceptRequestBody)
  const handlers = [get, create, update]
  for (const buildHandler of handlers) {
    const handler = buildHandler(app, parentRouter)
    router.use(handler.routes(), handler.allowedMethods())
  }
  return router
}
