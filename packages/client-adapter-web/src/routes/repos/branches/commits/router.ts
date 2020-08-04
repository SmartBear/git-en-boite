import { Application } from 'git-en-boite-client-port'
import Router from '@koa/router'

import create from './create'
import { buildHandlers } from '../../../../build_handlers'

export default (app: Application, parentRouter: Router): Router =>
  new Router().use(...buildHandlers([create], app, parentRouter))
