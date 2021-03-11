import { Application } from 'git-en-boite-core'
import Router from '@koa/router'

import show from './show'
import { buildHandlers } from '../../../../build_handlers'

export default (app: Application, parentRouter: Router): Router =>
  new Router().use('/files', ...buildHandlers([show], app, parentRouter))
