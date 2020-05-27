import { Application, ListensOnPort } from 'git-en-boite-client-port'
import Router from './router'
import WebApp from './web_app'

export function createWebApp(app: Application): ListensOnPort {
  const routes = Router.create(app)
  const webApp = WebApp.withRoutes(routes)
  return webApp
}
