import { Application } from 'git-en-boite-core'
import Router from '@koa/router'

import commits from './commits/router'

export default (app: Application, parentRouter: Router): Router =>
  new Router().use(
    '/:branchName/commits',
    commits(app, parentRouter).routes(),
    commits(app, parentRouter).allowedMethods()
  )
