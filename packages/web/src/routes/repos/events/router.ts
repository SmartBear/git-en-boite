import { Application } from 'git-en-boite-core'
import Router from '@koa/router'

import index from './index'
import { buildHandlers } from '../../../build_handlers'

export default (app: Application, parentRouter: Router): Router =>
  new Router().use(...buildHandlers([index], app, parentRouter))
