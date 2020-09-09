import Router from '@koa/router'
import { Application, DomainEvents, RepoId } from 'git-en-boite-core'
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
    for (const eventKey of DomainEvents.keys) {
      app.events.on(eventKey, event => {
        // TODO: test this logic
        if (!event.repoId.equals(repoId)) return
        // TODO: put events in an envelope with type in it?
        response.write(`event: ${eventKey}\n`)
        response.write(`data: ${JSON.stringify(event)}\n`)
        response.write(`\n`)
      })
    }
    // TODO: remove the event listener when the connection is closed.
  })
