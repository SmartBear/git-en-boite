import { Context } from 'koa'
import { PassThrough } from 'stream'

export class ServerSentEventsResponse extends PassThrough {
  constructor(ctx: Context) {
    super({ objectMode: true })
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    ctx.status = 200
    ctx.body = this
    this.write('\n')
  }

  writeEvent(name: string, data: any): void {
    this.write(`event: ${name}\n`)
    this.write(`data: ${JSON.stringify(data)}\n`)
    this.write(`\n`)
  }
}
