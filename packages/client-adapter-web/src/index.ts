import { Application, ListensOnPort } from 'git-en-boite-client-port'

import createRouter from './routes/router'
import createWebApp from './create_web_app'

export default (app: Application): ListensOnPort => {
  const webApp = createWebApp()
    .use(createRouter(app).routes())
    .use(createRouter(app).allowedMethods())
  return webApp
}
