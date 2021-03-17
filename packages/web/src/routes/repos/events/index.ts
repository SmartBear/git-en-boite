import Router from '@koa/router'
import { DomainEvent, DomainEvents, EventName, ExposesDomainEvents, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import { PassThrough } from 'stream'

export default (app: ExposesDomainEvents): Router =>
  new Router().get('/', async (ctx: Context) => {
    const response = new PassThrough({ objectMode: true })
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.status = 200
    ctx.body = response

    const repoId = RepoId.fromJSON(ctx.params.repoId)
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
        if (!event.entityId.equals(repoId)) return
        response.write(`event: ${eventName}\n`)
        response.write(`data: ${JSON.stringify(event)}\n`)
        response.write(`\n`)
        if (ctx.query.until === eventName) {
          response.end()
        }
      }
    }
  })
