import Router from '@koa/router'
import { Context } from 'koa'
import supertest from 'supertest'

import createWebApp from './create_web_app'

describe(createWebApp.name, () => {
  describe('routing requests', () => {
    it('handles a regular route', async () => {
      const log = () => ({})
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => (ctx.status = 200)),
        log,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(200)
      server.close()
    })
  })
})
