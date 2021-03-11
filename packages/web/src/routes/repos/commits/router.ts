import { Application } from 'git-en-boite-core'
import Router from '@koa/router'

import files from './files/router'

export default (app: Application, parentRouter: Router): Router =>
  new Router().use('/:ref', files(app, parentRouter).routes(), files(app, parentRouter).allowedMethods())
