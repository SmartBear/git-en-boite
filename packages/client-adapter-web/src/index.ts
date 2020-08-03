import { Application } from 'git-en-boite-client-port'
import { Server } from 'http'

import createWebApp from './create_web_app'
import createRouter from './routes/router'

export const startWebServer = (app: Application, port: number): Server => {
  const webApp = createWebApp()
    .use(createRouter(app).routes())
    .use(createRouter(app).allowedMethods())
  return webApp.listen(port)
}
