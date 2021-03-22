import Router from '@koa/router'
import { DomainEvent, DomainEvents, EventName, ExposesDomainEvents, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import { ServerSentEventsResponse } from '../../../ServerSentEventsResponse'

export default (app: ExposesDomainEvents): Router =>
  new Router().get('/', async (ctx: Context) => {
    const response = new ServerSentEventsResponse(ctx)

    const repoId = RepoId.fromJSON(ctx.params.repoId)

    // TODO: resolve duplication with /events route
    for (const eventName of DomainEvents.names) {
      const listener = buildListener()
      app.events.on(eventName, listener)
      ctx.req.on('close', () => {
        app.events.off(eventName, listener)
      })
    }
    response.write('\n')

    function buildListener() {
      return (event: DomainEvent) => {
        if (!event.entityId.equals(repoId)) return
        response.writeEvent(event.type, event)
        if (ctx.query.until === event.type) {
          response.end()
        }
      }
    }
  })
