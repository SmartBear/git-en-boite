import { Application, WriteLogEvent } from 'git-en-boite-core'
import { Server } from 'http'

import createWebApp from './create_web_app'
import createRouter from './routes/router'

export const startWebServer = (app: Application, port: number, log: WriteLogEvent): Server => {
  return createWebApp(createRouter(app), log).listen(port)
}
