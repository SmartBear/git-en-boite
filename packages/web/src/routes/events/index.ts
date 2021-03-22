import Router from '@koa/router'
import { DomainEvent, DomainEvents, EventName, ExposesDomainEvents } from 'git-en-boite-core'
import { Context } from 'koa'
import { ServerSentEventsResponse } from '../../ServerSentEventsResponse'

export default (app: ExposesDomainEvents): Router =>
  new Router().get('/', async (ctx: Context) => {
    const response = new ServerSentEventsResponse(ctx)

    // TODO: resolve duplication with repo/:repoId/events route
    for (const eventName of DomainEvents.names) {
      const listener = buildListener()
      app.events.on(eventName, listener)
      ctx.req.on('close', () => {
        app.events.off(eventName, listener)
      })
    }

    function buildListener() {
      return (event: DomainEvent) => {
        response.writeEvent(event.type, event)
        if (ctx.query.until === event.type && (!ctx.query.entityId || ctx.query.entityId === event.entityId.value)) {
          response.end()
        }
      }
    }
  })
