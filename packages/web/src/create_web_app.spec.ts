import Router from '@koa/router'
import { Logger } from 'git-en-boite-core'
import { assertThat, equalTo, hasProperty, isEmpty, matchesPattern } from 'hamjest'
import { wasCalled, wasCalledWith } from 'hamjest-sinon'
import { Context } from 'koa'
import supertest, { SuperTest, Test } from 'supertest'
import { stubInterface } from 'ts-sinon'

import createWebApp from './create_web_app'

describe(createWebApp.name, () => {
  describe('routing requests', () => {
    it('handles a regular route', async () => {
      const logger = stubInterface<Logger>()
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => (ctx.status = 200)),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(200)
      server.close()
    })
  })

  describe('logging requests', () => {
    it('logs 200 responses as info', async () => {
      const logger = stubInterface<Logger>()
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => (ctx.status = 200)),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(200)
      assertThat(logger.info, wasCalled())
      assertThat(
        logger.info,
        wasCalledWith(
          matchesPattern(/GET/),
          hasProperty('request', hasProperty('url', equalTo('/'))),
        ),
      )
      server.close()
    })

    it('logs 400 responses as warn', async () => {
      const logger = stubInterface<Logger>()
      const app = createWebApp(
        new Router().get('/', async (ctx: Context) => {
          ctx.throw(400)
        }),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(400)
      assertThat(logger.warn, wasCalled())
      assertThat(
        logger.warn,
        wasCalledWith(
          matchesPattern(/GET/),
          hasProperty('request', hasProperty('url', equalTo('/'))),
        ),
      )
      server.close()
    })

    it('logs 500 responses as error', async () => {
      const logger = stubInterface<Logger>()
      // Use this if you want to have a look at the complete logged message:
      // logger.error = sinon.spy((...args: any[]) => console.log(...args))
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => ctx.throw(new Error('yikes'))),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(500)
      assertThat(logger.error, wasCalled())
      assertThat(
        logger.error,
        wasCalledWith(
          matchesPattern(/GET/),
          hasProperty('request', hasProperty('url', equalTo('/'))),
        ),
      )
      server.close()
    })
  })

  describe('handling exceptions', () => {
    it('does not write anything to stderr', async () => {
      const logger = stubInterface<Logger>()
      const error = new Error('yikes')
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => ctx.throw(error)),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      const lines = await captureStdErr(async () => {
        await request.get('/').expect(500)
      })
      assertThat(lines, isEmpty())
      server.close()

      async function captureStdErr(fn: () => Promise<void>) {
        const lines: string[] = []
        const original = process.stderr.write
        process.stderr.write = (line: string) => !!lines.push(line)
        try {
          await fn()
          return lines
        } catch (error) {
          throw error
        } finally {
          process.stderr.write = original
        }
      }
    })

    it('logs Internal Server errors', async () => {
      const logger = stubInterface<Logger>()
      const error = new Error('yikes')
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => ctx.throw(error)),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(500)
      assertThat(logger.error.callCount, equalTo(2))
      assertThat(logger.error, wasCalledWith(error))
      server.close()
    })

    it('does not log 4xx errors', async () => {
      const logger = stubInterface<Logger>()
      const error = new Error('whoops')
      const app = createWebApp(
        new Router().get('/', (ctx: Context) => ctx.throw(400, error)),
        logger,
      )
      const server = app.listen()
      const request = supertest(server)
      await request.get('/').expect(400)
      assertThat(logger.error.callCount, equalTo(1))
      server.close()
    })
  })
})
