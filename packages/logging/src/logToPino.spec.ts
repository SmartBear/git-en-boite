import { logToPino } from './logToPino'
import * as pino from 'pino'
import * as split from 'split2'
import * as Koa from 'koa'
import { assertThat, hasProperty, not } from 'hamjest'
import * as supertest from 'supertest'

describe(logToPino.name, () => {
  describe('serializing objects', () => {})
  it('serializes HTTP request and response objects', async () => {
    const lines: unknown[] = []
    const stream = split((data) => {
      lines.push(JSON.parse(data))
    })
    const app = new Koa()
    const log = logToPino(pino(stream))
    app.use(async (ctx, next) => {
      await next()
      log({ message: 'a request', level: 'info', req: ctx.req, res: ctx.res })
    })
    app.use((ctx) => (ctx.status = 200))
    const server = app.listen(9899)
    await supertest(server).get('/').expect(200)
    server.close()
    assertThat(lines[0], hasProperty('req', not(hasProperty('_events'))))
    assertThat(lines[0], hasProperty('res', not(hasProperty('_events'))))
  })
})
