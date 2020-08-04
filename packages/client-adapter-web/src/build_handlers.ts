import Router from '@koa/router'
import { Application } from 'git-en-boite-client-port'
import { Middleware } from 'koa'

type BuildHandler = (app: Application, parentRouter: Router) => Router

export const buildHandlers = (
  buildHandlers: BuildHandler[],
  app: Application,
  parentRouter: Router,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Middleware<any, any>[] =>
  buildHandlers
    .map(buildHandler => {
      const handler = buildHandler(app, parentRouter)
      return [handler.routes(), handler.allowedMethods()]
    })
    .flat()
