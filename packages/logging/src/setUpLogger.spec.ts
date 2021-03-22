import { assertThat, equalTo, hasProperty, not } from 'hamjest'
import * as Koa from 'koa'
import * as supertest from 'supertest'

import { captureStdOut } from './captureStdOut'
import { setUpLogger } from './setUpLogger'

describe(setUpLogger.name, () => {
  it('serializes HTTP request and response objects', async () => {
    const lines = await captureStdOut(async () => {
      const app = new Koa()
      const log = setUpLogger({}, { readableBy: 'machines' })
      app.use(async (ctx, next) => {
        await next()
        log({ message: 'a request', level: 'info', req: ctx.req, res: ctx.res })
      })
      app.use((ctx) => (ctx.status = 200))
      const server = app.listen(9899)
      await supertest(server).get('/').expect(200)
      server.close()
    })
    assertThat(JSON.parse(lines[0]), hasProperty('req', not(hasProperty('_events'))))
    assertThat(JSON.parse(lines[0]), hasProperty('req', hasProperty('method', equalTo('GET'))))
    assertThat(JSON.parse(lines[0]), hasProperty('res', not(hasProperty('_events'))))
  })

  it('logs an Error as warning', async () => {
    const lines = await captureStdOut(async () => {
      const log = setUpLogger({}, { readableBy: 'machines' })
      log(new Error('Yikes!'))
    })
    assertThat(JSON.parse(lines[0]), hasProperty('msg', equalTo('Yikes!')))
    assertThat(JSON.parse(lines[0]), hasProperty('level', equalTo('warn')))
  })
})
