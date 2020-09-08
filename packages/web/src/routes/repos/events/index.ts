import Router from '@koa/router'
import { Application, DomainEventBus, RepoId } from 'git-en-boite-core'
import { Context } from 'koa'
import { PassThrough } from 'stream'

export default (app: Application): Router =>
  new Router().get('/', async (ctx: Context) => {
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.status = 200
    const events = new PassThrough({ objectMode: true })
    ctx.body = events

    const repoId = RepoId.fromJSON(ctx.params.repoId)
    // TODO: expose SubscribesToEventBus from Application
    const bus: DomainEventBus = (app as any)['domainEvents']
    // TODO: some kind of wildcard event handler?
    bus.on('repo.fetched', e => {
      if (!e.repoId.equals(repoId)) return
      // TODO: put events in an envelope with type in it?
      events.write(`event: repo.fetched\n`)
      events.write(`data: ${JSON.stringify(e)}\n`)
      events.write(`\n`)
    })
  })
