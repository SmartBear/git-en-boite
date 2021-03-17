import Router from '@koa/router'
import { DomainEvent, DomainEvents, EventName, ExposesDomainEvents } from 'git-en-boite-core'
import { Context } from 'koa'
import { PassThrough } from 'stream'

export default (app: ExposesDomainEvents): Router =>
  new Router().get('/', async (ctx: Context) => {
    // TODO: resolve duplication with repo/:repoId/events route
    const response = new PassThrough({ objectMode: true })
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.status = 200
    ctx.body = response

    for (const eventName of DomainEvents.names) {
      const listener = buildListener(eventName)
      app.events.on(eventName, listener)
      ctx.req.on('close', () => {
        app.events.off(eventName, listener)
      })
    }
    response.write('\n')

    function buildListener(eventName: EventName) {
      return (event: DomainEvent) => {
        response.write(`event: ${eventName}\n`)
        response.write(`data: ${JSON.stringify(event)}\n`)
        response.write(`\n`)
        if (ctx.query.until === eventName && (!ctx.query.entityId || ctx.query.entityId === event.entityId.value)) {
          response.end()
        }
      }
    }
  })
