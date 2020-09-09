import Router from '@koa/router'
import { Application, DomainEvents, RepoId, RepoEvent, DomainEventBus } from 'git-en-boite-core'
import { Context } from 'koa'
import { PassThrough } from 'stream'

export default (app: Application): Router =>
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
    const emit = (eventKey: keyof DomainEvents) => (event: RepoEvent) => {
      // TODO: test this logic
      if (!event.repoId.equals(repoId)) return
      response.write(`event: ${eventKey}\n`)
      response.write(`data: ${JSON.stringify(event)}\n`)
      response.write(`\n`)
    }
    for (const eventKey of DomainEvents.keys) {
      const listener = emit(eventKey)
      app.events.on(eventKey, listener)
      ctx.req.on('close', () => {
        app.events.off(eventKey, listener)
      })
    }
  })
