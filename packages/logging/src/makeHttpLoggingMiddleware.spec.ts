import { logToPino } from '.'
import { assertThat, equalTo, hasProperty, matchesPattern, not } from 'hamjest'
import { Server } from 'http'
import * as Koa from 'koa'
import * as pino from 'pino'
import * as split from 'split2'
import * as supertest from 'supertest'

import { logErrorsFrom, makeHttpLoggingMiddleware } from './makeHttpLoggingMiddleware'

describe(makeHttpLoggingMiddleware.name, () => {
  let server: Server
  const request = (app: Koa) => {
    server = app.listen(9899)
    return supertest(server)
  }
  afterEach(() => server.close())

  it('logs a 200 request', async () => {
    const lines: unknown[] = []
    const stream = split((data) => {
      lines.push(JSON.parse(data))
    })
    const app = new Koa()
    app.use(makeHttpLoggingMiddleware(logToPino(pino(stream))))
    app.use((ctx) => (ctx.status = 200))
    await request(app).get('/').expect(200)
    assertThat(lines[0], hasProperty('req', not(hasProperty('_events'))))
    assertThat(lines[0], hasProperty('req', hasProperty('url', equalTo('/'))))
    assertThat(lines[0], hasProperty('message', equalTo('-> GET /')))
    assertThat(lines[0], hasProperty('level', equalTo('info')))
  })

  it('logs a 200 response', async () => {
    const lines: unknown[] = []
    const stream = split((data) => {
      lines.push(JSON.parse(data))
    })
    const app = new Koa()
    app.use(makeHttpLoggingMiddleware(logToPino(pino(stream))))
    app.use((ctx) => (ctx.status = 200))
    await request(app).get('/').expect(200)
    assertThat(lines[1], hasProperty('req', hasProperty('url', equalTo('/'))))
    assertThat(lines[1], hasProperty('res', hasProperty('statusCode', equalTo(200))))
    assertThat(lines[1], hasProperty('message', equalTo('<- 200 GET /')))
    assertThat(lines[1], hasProperty('level', equalTo('info')))
  })

  it('logs a 400 response at level "info"', async () => {
    const lines: unknown[] = []
    const stream = split((data) => {
      lines.push(JSON.parse(data))
    })
    const app = new Koa()
    app.use(makeHttpLoggingMiddleware(logToPino(pino(stream))))
    app.use((ctx) => ctx.throw(400))
    await request(app).get('/').expect(400)
    assertThat(lines.length, equalTo(2))
    assertThat(lines[1], hasProperty('res', hasProperty('statusCode', equalTo(400))))
    assertThat(lines[1], hasProperty('message', equalTo('<- 400 GET /')))
    assertThat(lines[1], hasProperty('level', equalTo('info')))
  })

  it('logs a 500 response at level "warn"', async () => {
    const lines: unknown[] = []
    const stream = split((data) => {
      lines.push(JSON.parse(data))
    })
    const app = new Koa()
    app.use(makeHttpLoggingMiddleware(logToPino(pino(stream))))
    app.use(() => {
      throw new Error('yikes')
    })
    app.silent = true
    await request(app).get('/').expect(500)
    assertThat(lines.length, equalTo(2))
    assertThat(lines[1], hasProperty('res', hasProperty('statusCode', equalTo(500))))
    assertThat(lines[1], hasProperty('message', equalTo('<- 500 GET /')))
    assertThat(lines[1], hasProperty('level', equalTo('warn')))
  })

  describe(logErrorsFrom.name, () => {
    it('logs an Error at level "error"', async () => {
      const lines: unknown[] = []
      const stream = split((data) => {
        lines.push(JSON.parse(data))
      })
      const app = new Koa()
      app.use(() => {
        throw new Error('yikes')
      })
      logErrorsFrom(app).to(logToPino(pino(stream)))
      await request(app).get('/').expect(500)
      assertThat(lines.length, equalTo(1))
      assertThat(lines[0], hasProperty('message', equalTo('yikes')))
      assertThat(lines[0], hasProperty('stack', matchesPattern(/Error: yikes/)))
      assertThat(lines[0], hasProperty('level', equalTo('error')))
    })

    it("logs a custom error's properties", async () => {
      class CustomError extends Error {
        constructor(message: string, public readonly one: string, public readonly two: number) {
          super(message)
        }
      }
      const lines: unknown[] = []
      const stream = split((data) => {
        lines.push(JSON.parse(data))
      })
      const app = new Koa()
      app.use(() => {
        throw new CustomError('yikes', 'a-value', 99)
      })
      logErrorsFrom(app).to(logToPino(pino(stream)))
      await request(app).get('/').expect(500)
      assertThat(lines.length, equalTo(1))
      assertThat(lines[0], hasProperty('one', equalTo('a-value')))
      assertThat(lines[0], hasProperty('two', equalTo(99)))
    })
  })
})
