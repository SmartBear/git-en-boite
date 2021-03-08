import { Application } from 'git-en-boite-core'
import Router from '@koa/router'
import create from './create'
import get from './get'
import update from './update'
import { buildHandlers } from '../../build_handlers'
import branches from './branches/router'
import events from './events/router'
import fetches from './fetches/router'

export default (app: Application, parentRouter: Router): Router =>
  new Router()
    .use(...buildHandlers([get, create, update], app, parentRouter))
    .use('/:repoId/branches', branches(app, parentRouter).routes(), branches(app, parentRouter).allowedMethods())
    .use('/:repoId/events', events(app, parentRouter).routes(), events(app, parentRouter).allowedMethods())
    .use('/:repoId/fetches', fetches(app, parentRouter).routes(), events(app, parentRouter).allowedMethods())
