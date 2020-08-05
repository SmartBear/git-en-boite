import { Application } from 'git-en-boite-client-port'
import Router from '@koa/router'
import create from './create'
import get from './get'
import update from './update'
import { buildHandlers } from '../../build_handlers'
import branches from './branches/router'

export default (app: Application, parentRouter: Router): Router =>
  new Router()
    .use(...buildHandlers([get, create, update], app, parentRouter))
    .use(
      '/:repoId/branches',
      branches(app, parentRouter).routes(),
      branches(app, parentRouter).allowedMethods(),
    )
